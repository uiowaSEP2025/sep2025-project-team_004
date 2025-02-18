import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";




const categories = [
  { id: "1", name: "Popular", icon: "star" },
  { id: "2", name: "Air", icon: "air" },
  { id: "3", name: "Soil", icon: "terrain" },
  { id: "4", name: "Replacement", icon: "build" },
  { id: "5", name: "Other", icon: "more-horiz" },
];

const products = [
  { id: "1", name: "WiFi Air Sensor", price: 120, image: require("../../assets/images/react-logo.png") },
  { id: "2", name: "Lora Soil Sensor", price: 225, image: require("../../assets/images/react-logo.png") },
  { id: "3", name: "Battery Replacement", price: 20, image: require("../../assets/images/react-logo.png") },
  { id: "4", name: "Tool Kit", price: 50, image: require("../../assets/images/react-logo.png") },
];

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Feather name="search" size={24} color="black" />
        <Text style={styles.title}>Make your community BETTER</Text>
        <Feather name="shopping-cart" size={24} color="black" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={[styles.categoryButton, category.id === "1" && styles.activeCategory]}>
            <MaterialIcons name={category.icon as any} size={24} color={category.id === "1" ? "white" : "black"} />
            <Text style={[styles.categoryText, category.id === "1" && styles.activeText]}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Image source={item.image} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            <TouchableOpacity style={styles.cartButton}>
              <MaterialIcons name="shopping-cart" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  categoryScroll: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategory: {
    backgroundColor: "black",
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 14,
    color: "black",
  },
  activeText: {
    color: "white",
  },
  grid: {
    paddingHorizontal: 10,
  },
  productCard: {
    flex: 1,
    alignItems: "center",
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    padding: 10,
  },
  productImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  cartButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 6,
  },
});
