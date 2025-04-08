import React from "react";
import { Image, StyleSheet, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

interface Sensor {
  id: string;
  nickname: string;
  sensor_type: "air" | "soil";
  latitude: number;
  longitude: number;
}

interface Props {
  sensors: Sensor[];
  defaultRegion: Region;
}

const MapSection: React.FC<Props> = ({ sensors, defaultRegion }) => {
  return (
    <MapView testID="map-view" style={StyleSheet.absoluteFillObject} initialRegion={defaultRegion}>
      {sensors.map((sensor) => (
        <Marker
          key={sensor.id}
          testID="map-marker"
          coordinate={{ latitude: sensor.latitude, longitude: sensor.longitude }}
          title={sensor.nickname || sensor.id}
          description={`Type: ${sensor.sensor_type}`}
        >
          <View style={styles.markerContainer}>
            <View style={styles.markerCircle}>
              <Image
                source={
                  sensor.sensor_type === "air"
                    ? require("../assets/images/air-sensor.png")
                    : require("../assets/images/soil-sensor.png")
                }
                style={styles.markerImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
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
});

export default MapSection;
