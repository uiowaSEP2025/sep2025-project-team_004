import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import SensorSelector from "../SensorSelector";
import SensorChart from "../SensorChart";
import MapSection from "../MapSection";
import NoSensorFallbackView from "../NoSensorFallback";
import HomeSkeletonLoader from "@/components/skeletons/HomeSkeletonLoader";

import { useFocusEffect } from '@react-navigation/native';

const chartCache: Record<string, any> = {};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const WelcomePage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [defaultRegion, setDefaultRegion] = useState<any>(null);
  const [userSensors, setUserSensors] = useState<any[]>([]);
  const [hasNoSensors, setHasNoSensors] = useState(false);

  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month">("today");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const SENSOR_URL = process.env.EXPO_PUBLIC_SENSOR_DATA_URL;

  useEffect(() => {
    const loadUserId = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        setCurrentUserId(parsed.id);
      }
    };
  
    loadUserId();
  }, []);
  

  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) return;
  
        const sensors = await fetchUserSensors(token);
        if (!sensors || sensors.length === 0) {
          setHasNoSensors(true);
          return;
        }
  
        setUserSensors(sensors);
        const defaultSensor = sensors.find((s: any) => s.is_default);
        if (defaultSensor) {
          setSelectedSensor(defaultSensor);
          await fetchSensorData(defaultSensor.id);
          setDefaultRegion({
            latitude: parseFloat(defaultSensor.latitude),
            longitude: parseFloat(defaultSensor.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      };
  
      refresh();
    }, [])
  );
  

  const isChartDataReady = sensorData.length > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        const fetchedSensors = await fetchUserSensors(token);
        if (fetchedSensors) {
          setUserSensors(fetchedSensors);
          const defaultSensor = fetchedSensors.find((s: any) => s.is_default);
          if (defaultSensor) {
            setSelectedSensor(defaultSensor);
            await fetchSensorData(defaultSensor.id);
          }
        }
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchUserSensors = async (token: string): Promise<any[] | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors/my/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch sensors: ${res.status}`);
      const sensors = await res.json();
      const normalized = sensors.map((s: any) => ({ ...s, id: s.sensor_id }));
      console.log(normalized)
      await AsyncStorage.setItem("sensors", JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      console.error("Error fetching sensors:", error);
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
      Object.keys(chartCache).forEach((key) => delete chartCache[key]);
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

  const makeChartData = (key: string, cutoff: Date): { x: string | number; y: number }[] => {
    if (!selectedSensor?.id) return [];
  
    const cacheKey = `${selectedSensor.id}-${selectedRange}-${key}`;
    if (chartCache[cacheKey]) {
      return chartCache[cacheKey];
    }
  
  
    const result: { x: string | number; y: number }[] = [];
  
    sensorData.forEach((d) => {
      const time = new Date(d.time);
      if (time >= cutoff) {
        const val = parseFloat(d[key]);
        if (!isNaN(val) && isFinite(val)) {
          const xLabel =
            selectedRange === "today"
              ? time.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : time.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                });
          result.push({ x: xLabel, y: val });
        }
      }
    });
  
    chartCache[cacheKey] = result;
    return result;
  };

  const tempData = useMemo(() => makeChartData("temperature", cutoff), [sensorData, selectedRange, selectedSensor]);
  const presData = useMemo(() => makeChartData("pressure", cutoff), [sensorData, selectedRange, selectedSensor]);
  const humData = useMemo(() => makeChartData("humidity", cutoff), [sensorData, selectedRange, selectedSensor]);

  if (hasNoSensors) return <NoSensorFallbackView />;

  if (loading) {
    return <HomeSkeletonLoader />;
  }

  if (!selectedSensor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator testID="ActivityIndicator" size="large" color="#007AFF" />
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
              setSelectedSensor(sensor);
              await fetchSensorData(sensor.id);
            }
          }}
          currentUserId={currentUserId}
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {!isChartDataReady ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : (
              <>
                <SensorChart title="Temperature (°C)" data={tempData} color="rgb(32, 190, 58)"/>
                <SensorChart title="Pressure (hPa)" data={presData} color="rgb(152, 13, 199)"/>
                <SensorChart title="Humidity (%)" data={humData} color="rgb(37, 147, 238)" />
              </>
            )}
          </ScrollView>
        )}

<TouchableOpacity
  testID="ToggleMapButton"
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
