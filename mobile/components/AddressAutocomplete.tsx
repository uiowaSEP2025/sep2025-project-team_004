import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export default function AddressAutocomplete({ value, onSelect }: { value: string; onSelect: (val: string, extras?: any) => void }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch (error) {
        console.error("Autocomplete fetch error:", error);
      }
    };

    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Enter your address..."
        style={styles.input}
      />
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setQuery(item.description);
              setSuggestions([]);
              onSelect(item.description); // You can fetch place details later if needed
            }}
          >
            <Text style={styles.suggestion}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  suggestion: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
