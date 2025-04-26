import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

function getComponent(components: any[], type: string) {
  const match = components.find(c => c.types.includes(type));
  return match?.long_name || "";
}

export default function AddressAutocomplete({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (val: string, extras?: { city?: string; state?: string; zip?: string }) => void;
}) {
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

  const handleSelect = async (item: any) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const result = data.result;
      setQuery(result.formatted_address);
      setSuggestions([]);

      const components = result.address_components;
      const extras = {
        city: getComponent(components, "locality"),
        state: getComponent(components, "administrative_area_level_1"),
        zip: getComponent(components, "postal_code"),
      };

      onSelect(result.formatted_address, extras);
    } catch (err) {
      console.error("Place details error:", err);
      onSelect(item.description);
    }
  };

  return (
    <View style={{ zIndex: 100 }}> {/* helps prevent dropdown clipping */}
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
          <TouchableOpacity onPress={() => handleSelect(item)}>
            <Text style={styles.suggestion}>{item.description}</Text>
          </TouchableOpacity>
        )}
        style={styles.suggestionList}
        keyboardShouldPersistTaps="handled"
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  suggestionList: {
    maxHeight: 150,
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 2,
  },
});
