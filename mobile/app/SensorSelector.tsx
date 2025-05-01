import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

interface Sensor {
  id: string;
  nickname: string;
  sensor_type: "air" | "soil";
  latitude: number;
  longitude: number;
  is_default?: boolean;
}

interface Props {
  selectedSensor: Sensor;
  userSensors: Sensor[];
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  onSelect: (sensor: Sensor) => void;
}

const SensorSelector: React.FC<Props> = ({
  selectedSensor,
  userSensors,
  showDropdown,
  setShowDropdown,
  onSelect,
}) => {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)} style={styles.selector}>
        <Image
          source={
            selectedSensor.sensor_type === "air"
              ? require("../assets/images/air-sensor.png")
              : require("../assets/images/soil-sensor.png")
          }
          style={styles.icon}
        />
        <View style={styles.info}>
          <Text style={styles.nickname}>{selectedSensor.nickname || "Unnamed Sensor"}</Text>
          <Text style={styles.type}>{selectedSensor.sensor_type === "air" ? "Air Sensor" : "Soil Sensor"}</Text>
        </View>
        <Text style={styles.arrow}>{showDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdown}>
          {userSensors.map((sensor) => (
            <TouchableOpacity
              key={sensor.id}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(sensor);
                setShowDropdown(false);
              }}
            >
              <Image
                source={
                  sensor.sensor_type === "air"
                    ? require("../assets/images/air-sensor.png")
                    : require("../assets/images/soil-sensor.png")
                }
                style={styles.smallIcon}
              />
              <View style={styles.dropdownInfo}>
                <Text style={styles.dropdownNickname}>{sensor.nickname}</Text>
                <Text style={styles.dropdownType}>
                  {sensor.sensor_type === "air" ? "Air Sensor" : "Soil Sensor"}
                </Text>
              </View>
              <Image
                source={require("../assets/images/settingsIcon.png")}
                style={styles.settingsIcon}
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addSensorButton}
            onPress={() => {
              router.push('/AddSensors');
              setShowDropdown(false);
            }}
          >
            <Text style={styles.addSensorButtonText}>Add More Sensors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deployButton}
            onPress={() => {
              router.push('/first-look');
              setShowDropdown(false);
            }}
          >
            <Text style={styles.deployButtonText}>First Time Deploy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginTop: 60,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  info: { flex: 1 },
  nickname: {
    fontSize: 18,
    fontWeight: "600",
  },
  type: {
    fontSize: 14,
    color: "#666",
  },
  arrow: {
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
  smallIcon: {
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
  addSensorButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 0,
  },
  addSensorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deployButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 0,
  },
  deployButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SensorSelector;
