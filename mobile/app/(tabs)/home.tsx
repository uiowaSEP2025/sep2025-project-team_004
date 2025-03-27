import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal } from "react-native";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { usePayment } from "../context/PaymentContext";
import { LineChart } from "react-native-chart-kit";

const WelcomePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const { clearCards } = usePayment();

  // 🟡 Sensor chart state
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month">("month");

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
            console.log(points);

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

  const formatChartData = (key: string, min: number, max: number) => {
  const now = new Date();
  let cutoff = new Date(0); // default to earliest possible date
  if (selectedRange === "today") {
    cutoff = new Date(now.setHours(0, 0, 0, 0));
  } else if (selectedRange === "week") {
   cutoff = new Date(now.setDate(now.getDate() - 7));
  }

  const values: number[] = [];
  const labels: string[] = [];

  sensorData.forEach((d) => {
    const time = new Date(d.time);
    if (time >= cutoff) {
      const val = parseFloat(d[key]);
      if (!isNaN(val) && isFinite(val)) {
        values.push(val);
        labels.push(
          time.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        );
      }
    }
  });

  const step = Math.ceil(values.length / 10);
  const filteredValues = values.filter((_, i) => i % step === 0);
  const filteredLabels = labels.map((label, i) =>
    i % step === 0 ? label : ""
  );

  if (filteredLabels.length > 0) {
    filteredLabels.push("");
  }

  const paddedValues = filteredValues;

  return {
    labels: filteredLabels,
    datasets: [{ data: paddedValues }],
  };
};

  

  const chartWidth = Dimensions.get("window").width - 32;

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
              <View style={styles.card}>
                <Text style={styles.chartTitle}>Temperature (°C)</Text>
                <LineChart
                  data={formatChartData("temperature", -15, 30)}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  fromZero={false}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  yLabelsOffset={8}
                  xLabelsOffset={-4}
                  horizontalLabelRotation={0}
                  style={{transform: [{translateX: -12}]}}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.chartTitle}>Pressure (hPa)</Text>
                <LineChart
                  data={formatChartData("pressure", 800, 1100)}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  fromZero={false}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  yLabelsOffset={8}
                  xLabelsOffset={-4}
                  horizontalLabelRotation={0}
                  style={{transform: [{translateX: -12}]}}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.chartTitle}>Humidity (%)</Text>
                <LineChart
                  data={formatChartData("humidity", 0, 100)}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  fromZero={false}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  yLabelsOffset={8}
                  xLabelsOffset={-4}
                  horizontalLabelRotation={0}
                  style={{transform: [{translateX: -12}]}}
                />
              </View>
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

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // blue line
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  propsForDots: {
    r: "1", // smaller dots
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 24,
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
