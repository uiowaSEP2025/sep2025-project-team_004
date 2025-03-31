import React, { useState, useRef, useEffect, } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback, 
  Keyboard,
  Modal,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePayment } from "../context/PaymentContext";
import { LineChart } from "react-native-chart-kit";

const WelcomePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const { clearCards } = usePayment();


  const [sensorData, setSensorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month">("today");
  const [tempData, setTempData] = useState<any>(null);
  const [presData, setPresData] = useState<any>(null);
  const [humData, setHumData] = useState<any>(null);

  const SENSOR_URL = process.env.EXPO_PUBLIC_SENSOR_DATA_URL;
  console.log(SENSOR_URL);

  type SensorDataPoint = {
    time: string;
    temperature: string;
    pressure: string;
    humidity: string;
    [key: string]: any;
  };


  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "index" }] });
      }
    };

    const fetchSensorData = async () => {
      try {
        const res = await fetch(SENSOR_URL!);
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          const json = JSON.parse(text);

          if (json.points && Array.isArray(json.points)) {
            const points: SensorDataPoint[] = json.points;
            //console.log(points);

            const sorted = points.sort((a, b) =>
              new Date(a.time).getTime() - new Date(b.time).getTime()
            );

            setSensorData(sorted);
            //console.log(sorted);
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
    checkAuth();
    fetchSensorData();
  }, []);

  

  const handleMenuToggle = () => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    if (sensorData.length === 0) return;

    setLoading(true);

    const timeout = setTimeout(() => {

    const now = new Date();
    let cutoff = new Date(0);
    if (selectedRange === "today") {
      cutoff = new Date(now.setHours(0, 0, 0, 0));
    } else if (selectedRange === "week") {
      cutoff = new Date(now.setDate(now.getDate() - 7));
    } else {
      cutoff = new Date(now.setDate(now.getDate() - 30));
    }

    const makeChartData = (key: string) => {
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

    setTempData(makeChartData("temperature"));
    setPresData(makeChartData("pressure"));
    setHumData(makeChartData("humidity"));
    setLoading(false);
  }, 50);

  return () => clearTimeout(timeout);
}, [sensorData, selectedRange]);

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      setModalVisible(true);
    } else {
      Alert.alert("Logout", "Are you sure you want to logout？", [
        { text: "Yes", onPress: () => confirmLogout() },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const confirmLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userInfo");
      clearCards();
      navigation.navigate("index");
      setModalVisible(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (menuVisible) setMenuVisible(false);
        Keyboard.dismiss();
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileIcon} onPress={handleMenuToggle}>
            <Text style={styles.profileIconText}>P</Text>
          </TouchableOpacity>

          {menuVisible && (
            <Animated.View
              style={[
                styles.menu,
                {
                  opacity: menuAnimation,
                  transform: [
                    {
                      scale: menuAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                  pointerEvents: menuVisible ? "auto" : "none",
                },
              ]}
            >
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Text style={styles.menuItem}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("editProfile")}>
                <Text style={styles.menuItem}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("home");
                  setMenuVisible(false);
                }}
              >
                <Text style={styles.menuItem}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.menuItem}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

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

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* 🟢 Sensor Charts */}
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : (
            <>
              {tempData && <SensorChart title="Temperature (°C)" data={tempData} config={tempChartConfig} />}
              {presData && <SensorChart title="Pressure (hPa)" data={presData} config={presChartConfig} />}
              {humData && <SensorChart title="Humidity (%)" data={humData} config={humChartConfig} />}  
            </>
          )}
        </ScrollView>

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Are you sure you want to log out?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={confirmLogout} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const tempChartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: () => `rgb(32, 190, 58)`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2.5,
  propsForDots: {
    r: "0", // smaller dots
    strokeWidth: "0",
  },
  propsForBackgroundLines: {
    stroke: "#e3e3e3", // light gray grid lines
    strokeDasharray: "", // solid lines
  },
};

const presChartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: () => `rgb(152, 13, 199)`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2.5,
  propsForDots: {
    r: "0", // smaller dots
    strokeWidth: "0",
  },
  propsForBackgroundLines: {
    stroke: "#e3e3e3", // light gray grid lines
    strokeDasharray: "", // solid lines
  },
};

const humChartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: () => `rgb(37, 147, 238)`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2.5,
  propsForDots: {
    r: "0", // smaller dots
    strokeWidth: "0",
  },
  propsForBackgroundLines: {
    stroke: "#e3e3e3", // light gray grid lines
    strokeDasharray: "", // solid lines
  },
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: Platform.OS === "web" ? 70 : 120,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
    paddingTop: Platform.OS === "web" ? 0 : 70,
    position: "relative",
    zIndex: 2,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIconText: {
    color: "#fff",
    fontWeight: "bold",
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 4,
    elevation: 4,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
    paddingVertical: 8,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
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
});

export default WelcomePage;
