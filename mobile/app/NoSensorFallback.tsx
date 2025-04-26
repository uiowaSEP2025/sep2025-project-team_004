import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types";

const NoSensorFallbackView: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        You must buy a sensor before you can view any data!
      </Text>
      <Text style={styles.message}>
        Please see our store to purchase your first sensor.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("store")}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Go to Store</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default NoSensorFallbackView;
