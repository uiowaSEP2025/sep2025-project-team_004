import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import SensorSelector from "../SensorSelector";
import SensorChart from "../SensorChart";
import MapSection from "../MapSection";
import NoSensorFallbackView from "../NoSensorFallback";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const WelcomePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [showMap, setShowMap] = useState(false);
  const [defaultRegion, setDefaultRegion] = useState<any>(null);
  const [userSensors, setUserSensors] = useState<any[]>([]);
  const [hasNoSensors, setHasNoSensors] = useState(false);

  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month">("today");

  const SENSOR_URL = process.env.EXPO_PUBLIC_SENSOR_DATA_URL;

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "index" }] });
          return;
        }

        const defaultSensorId = await fetchUserSensors(token);
        if (!defaultSensorId) {
          setLoading(false);
          return;
        }

        await fetchSensorData(defaultSensorId);

        const storedSensors = await AsyncStorage.getItem("sensors");
        if (storedSensors) {
          const sensors = JSON.parse(storedSensors);
          setUserSensors(sensors);

          const defaultSensor = sensors.find((s: any) => s.is_default);
          if (defaultSensor) setSelectedSensor(defaultSensor);

          if (defaultSensor?.latitude && defaultSensor?.longitude) {
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
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch sensors: ${res.status}`);

      const sensors = await res.json();
      await AsyncStorage.setItem("sensors", JSON.stringify(sensors));

      const defaultSensor = sensors.find((s: any) => s.is_default);
      if (!defaultSensor) {
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

  const cutoff = useMemo(() => {
    const now = new Date();
    if (selectedRange === "today") return new Date(now.setHours(0, 0, 0, 0));
    if (selectedRange === "week") return new Date(now.setDate(now.getDate() - 7));
    return new Date(now.setDate(now.getDate() - 30));
  }, [selectedRange]);

  const makeChartData = (key: string, cutoff: Date) => {
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

  const tempData = useMemo(() => makeChartData("temperature", cutoff), [sensorData, selectedRange]);
  const presData = useMemo(() => makeChartData("pressure", cutoff), [sensorData, selectedRange]);
  const humData = useMemo(() => makeChartData("humidity", cutoff), [sensorData, selectedRange]);

  if (hasNoSensors) return <NoSensorFallbackView />;

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
        <SensorSelector
          selectedSensor={selectedSensor}
          userSensors={userSensors}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onSelect={async (sensor) => {
            if (sensor.id !== selectedSensor.id) {
              setSelectedRange("today");
              setSensorData([]);
              setSelectedSensor(sensor);
              await fetchSensorData(sensor.id);
            }
          }}
        />

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
          <MapSection sensors={userSensors} defaultRegion={defaultRegion} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {!isChartDataReady ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : (
              <>
                <SensorChart title="Temperature (°C)" data={tempData} config={tempChartConfig} />
                <SensorChart title="Pressure (hPa)" data={presData} config={presChartConfig} />
                <SensorChart title="Humidity (%)" data={humData} config={humChartConfig} />
              </>
            )}
          </ScrollView>
        )}

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
});

export default WelcomePage;
