import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import Constants from "expo-constants";
import MapView, { Marker, Region } from "react-native-maps";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const WelcomePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [showMap, setShowMap] = useState(false);
  const [defaultRegion, setDefaultRegion] = useState<Region | null>(null);
  const [userSensors, setUserSensors] = useState<any[]>([]);
  const [hasNoSensors, setHasNoSensors] = useState(false);

  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [sensorData, setSensorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month">("today");

  const SENSOR_URL = process.env.EXPO_PUBLIC_SENSOR_DATA_URL;

  type SensorDataPoint = {
    time: string;
    temperature: string;
    pressure: string;
    humidity: string;
    [key: string]: any;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "index" }] });
          return;
        }
  
        // Step 1: Fetch sensors and store them
        const defaultSensorId = await fetchUserSensors(token);
        if (!defaultSensorId) {
          setLoading(false);
          return;
        }
  
        // Step 2: Fetch sensor data for chart view
        await fetchSensorData(defaultSensorId);
  
        // Step 3: Read sensors from AsyncStorage (after they’ve been saved)
        const storedSensors = await AsyncStorage.getItem("sensors");
        if (storedSensors) {
          const sensors = JSON.parse(storedSensors);
          setUserSensors(sensors);

  
          const defaultSensor = sensors.find((s: any) => s.is_default);
          if (defaultSensor) {
            setSelectedSensor(defaultSensor);
          }
  
          if (defaultSensor && defaultSensor.latitude && defaultSensor.longitude) {
            setDefaultRegion({
              latitude: parseFloat(defaultSensor.latitude),
              longitude: parseFloat(defaultSensor.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
  
    initialize();
  }, []);

const isChartDataReady = sensorData.length > 0;

const fetchUserSensors = async (token: string): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sensors/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sensors: ${res.status}`);
    }

    const sensors = await res.json();
    await AsyncStorage.setItem("sensors", JSON.stringify(sensors));

    const defaultSensor = sensors.find((s: any) => s.is_default);
    if (!defaultSensor) {
      console.warn("No default sensor found");
      setHasNoSensors(true);
      return null;
    }

    return defaultSensor.id;
  } catch (error) {
    console.error("Error fetching user sensors:", error);
    setHasNoSensors(true);
    return null;
  }
};

const fetchSensorData = async (sensorID: string) => {
  try {
    const res = await fetch(`${SENSOR_URL}${sensorID}`);
    const text = await res.text();
    if (text.trim().startsWith("{")) {
      const json = JSON.parse(text);
      const points = json?.data?.points;
      if (Array.isArray(points)) {
        const sorted = points.sort((a, b) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        setSensorData(sorted);
      } else {
        console.warn("No points array in response.");
      }
    } else {
      console.error("Response is not JSON:", text.slice(0, 300));
    }
  } catch (error) {
    console.error("Error fetching sensor data:", error);
  } finally {
    setLoading(false);
  }
};

const makeChartData = (key: keyof SensorDataPoint, cutoff: Date) => {

  const values: number[] = [];
  const labels: string[] = [];

  sensorData.forEach((d) => {
    const time = new Date(d.time);
    if (time >= cutoff) {
      const val = parseFloat(d[key]);
      if (!isNaN(val) && isFinite(val)) {
        values.push(val);
        labels.push(
          time.toLocaleString("en-US", {
            ...(selectedRange === "today"
              ? { hour: "2-digit", minute: "2-digit", hour12: false }
              : { month: "short", day: "numeric" }),
            timeZone: "UTC",
          })
        );
      }
    }
  });

  const step = Math.ceil(labels.length / 6);
  const finalLabels = labels.map((label, i) => (i % step === 0 ? label : ""));

  return {
    labels: finalLabels,
    datasets: [{ data: values }],
  };
};

const cutoff = useMemo(() => {
  const now = new Date();
  if (selectedRange === "today") {
    return new Date(now.setHours(0, 0, 0, 0));
  } else if (selectedRange === "week") {
    return new Date(now.setDate(now.getDate() - 7));
  } else {
    return new Date(now.setDate(now.getDate() - 30));
  }
}, [selectedRange]);

const tempData = useMemo(() => makeChartData("temperature", cutoff), [sensorData, selectedRange]);
const presData = useMemo(() => makeChartData("pressure", cutoff), [sensorData, selectedRange]);
const humData = useMemo(() => makeChartData("humidity", cutoff), [sensorData, selectedRange]);


const chartWidth = Dimensions.get("window").width - 32;

  const SensorChart = ({ title, data, config }: { title: string, data: any, config: any }) => (
    <View style={styles.card}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={data}
        width={chartWidth}
        height={220}
        chartConfig={config}
        withInnerLines
        withOuterLines
        withVerticalLines={false}
        fromZero={false}
        withHorizontalLabels
        withVerticalLabels
        yLabelsOffset={8}
        xLabelsOffset={-4}
        horizontalLabelRotation={0}
        style={{ transform: [{ translateX: -12 }] }}
        withShadow={false}
      />
    </View>
  );


  console.log(userSensors);
  if (hasNoSensors) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, textAlign: "center" }}>
          You must buy a sensor before you can view any data!
        </Text>
        <Text style={{ fontSize: 16, color: "#ffffff", textAlign: "center" }}>
          Please see our store to purchase your first sensor.
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("store")} style={{ marginTop: 20, backgroundColor: "#007AFF", padding: 10, borderRadius: 8 }}>
          <Text style={{ color: "white", fontWeight: "600" }}>Go to Store</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!selectedSensor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
    {/* Sensor Selector */}
<View style={styles.sensorSelectorWrapper}>
  <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)} style={styles.sensorSelector}>
    <Image
      source={
        selectedSensor?.sensor_type === "air"
          ? require("../../assets/images/air-sensor.png")
          : require("../../assets/images/soil-sensor.png")
      }
      style={styles.sensorIcon}
    />
    <View style={styles.sensorInfo}>
      <Text style={styles.sensorNickname}>{selectedSensor?.nickname || "Unnamed Sensor"}</Text>
      <Text style={styles.sensorType}>{selectedSensor?.sensor_type === "air" ? "Air Sensor" : "Soil Sensor"}</Text>
    </View>
    <Text style={styles.dropdownArrow}>{showDropdown ? "▲" : "▼"}</Text>
  </TouchableOpacity>

  {/* Dropdown List */}
  {showDropdown && (
    <View style={styles.dropdown}>
      {userSensors.map((sensor, index) => (
        <TouchableOpacity
          key={sensor.id}
          style={styles.dropdownItem}
          onPress={async () => {
            if (sensor.id !== selectedSensor?.id) {
              setSelectedRange("today");
              setSensorData([]);
              setSelectedSensor(sensor);
              await fetchSensorData(sensor.id);
            }
            setShowDropdown(false);
          }}
        >
          <Image
            source={
              sensor.sensor_type === "air"
                ? require("../../assets/images/air-sensor.png")
                : require("../../assets/images/soil-sensor.png")
            }
            style={styles.sensorIconSmall}
          />
          <View style={styles.dropdownInfo}>
            <Text style={styles.dropdownNickname}>{sensor.nickname}</Text>
            <Text style={styles.dropdownType}>{sensor.sensor_type === "air" ? "Air Sensor" : "Soil Sensor"}</Text>
          </View>
          <Image
            source={require("../../assets/images/settingsIcon.png")} // placeholder for now
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  )}
</View>
  {!showMap && (
    <View style={styles.toggleContainer}>
      {["today", "week", "month"].map((range) => (
        <TouchableOpacity
          key={range}
          onPress={() => setSelectedRange(range as any)}
          style={[
            styles.toggleButton,
            selectedRange === range && styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              selectedRange === range && styles.toggleTextActive,
            ]}
          >
            {range === "today" ? "Today" : range === "week" ? "Past Week" : "Past 30 Days"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )}

{showMap && defaultRegion ? (
  <MapView
    style={StyleSheet.absoluteFillObject}
    initialRegion={defaultRegion}
  >
    {userSensors.map((sensor, index) => (
      <Marker
        key={index}
        coordinate={{
          latitude: sensor.latitude,
          longitude: sensor.longitude,
        }}
        title={sensor.nickname || sensor.id}
        description={`Type: ${sensor.sensor_type}`}
      >
        <View style={styles.markerContainer}>
          <View style={styles.markerCircle}>
            <Image
              source={
                sensor.sensor_type === "air"
                  ? require("../../assets/images/air-sensor.png")
                  : require("../../assets/images/soil-sensor.png")
              }
              style={styles.markerImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Marker>
    ))}
  </MapView>
  ) : (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {!isChartDataReady ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          {tempData && <SensorChart title="Temperature (°C)" data={tempData} config={tempChartConfig} />}
          {presData && <SensorChart title="Pressure (hPa)" data={presData} config={presChartConfig} />}
          {humData && <SensorChart title="Humidity (%)" data={humData} config={humChartConfig} />}
        </>
      )}
    </ScrollView>
  )}

        {/* Toggle Button */}
        <TouchableOpacity
          style={styles.mapToggleButton}
          onPress={() => setShowMap((prev) => !prev)}
          >
          <Text style={styles.mapToggleText}>{showMap ? "↩" : "🗺"}</Text>
        </TouchableOpacity>
      </View>

    </TouchableWithoutFeedback>
  );
};

const getChartConfig = (color: string) => ({
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: () => color,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2.5,
  propsForDots: { r: "0", strokeWidth: "0" },
  propsForBackgroundLines: { stroke: "#e3e3e3", strokeDasharray: "" },
});

const tempChartConfig = getChartConfig("rgb(32, 190, 58)");
const presChartConfig = getChartConfig("rgb(152, 13, 199)");
const humChartConfig = getChartConfig("rgb(37, 147, 238)");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    marginTop: 20,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    backgroundColor: "#e3e3e3",
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: "#007AFF",
  },
  toggleText: {
    color: "#000",
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#fff",
  },  
  mapToggleButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 90,
  },
  mapToggleText: {
    color: "#fff",
    fontSize: 22,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  
  markerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  
  markerImage: {
    width: 80,
    height: 80,
  },
  sensorSelectorWrapper: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginTop: 60,
  },
  sensorSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  sensorIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorNickname: {
    fontSize: 18,
    fontWeight: "600",
  },
  sensorType: {
    fontSize: 14,
    color: "#666",
  },
  dropdownArrow: {
    fontSize: 30,
    marginLeft: 10,
    marginRight: 15,
    marginTop: 3,
  },
  dropdown: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    paddingVertical: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  sensorIconSmall: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  dropdownInfo: {
    flex: 1,
  },
  dropdownNickname: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownType: {
    fontSize: 13,
    color: "#666",
  },
  settingsIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
    marginRight: 8,
  },
});

export default WelcomePage;
