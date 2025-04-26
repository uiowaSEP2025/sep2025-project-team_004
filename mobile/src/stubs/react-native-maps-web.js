import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MapView = (props) => {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.infoText}>MapView is not available on the web.</Text>
    </View>
  );
};

const Marker = (props) => {
  return null;
};

const Region = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    color: "#333",
    fontSize: 16,
  },
});

export { MapView as default, Marker, Region };
