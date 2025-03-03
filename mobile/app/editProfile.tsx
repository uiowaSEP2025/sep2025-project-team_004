import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ImageBackground, Dimensions } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';
import AsyncStorage from "@react-native-async-storage/async-storage";


const EditProfilePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUserProfile = async () => {
    try {
        const token = await AsyncStorage.getItem("authToken");

        if (!token) {
            Alert.alert("Error", "User is not authenticated.");
            return;
        }

        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/profile/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`, 
            },
        });

        if (response.status === 403) {
            console.error("403 Forbidden - Check Django permissions");
            Alert.alert("Error", "You do not have permission to access this resource.");
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const userData = await response.json();

        setUsername(userData.username);
        setFirstName(userData.first_name);
        setLastName(userData.last_name);
        setPhone(userData.phone_number);
        setAddress(userData.address);
        setCity(userData.city);
        setState(userData.state);
        setZipCode(userData.zip_code);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        Alert.alert("Error", "An error occurred while loading user profile.");
    }
};


  useEffect(() => {
    fetchUserProfile();
  }, []);

  const updateUserProfile = async () => {
    try {
        const token = await AsyncStorage.getItem("authToken");

        if (!token) {
            Alert.alert("Error", "User is not authenticated.");
            return;
        }

        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/profile/update/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`,
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                address: address,
                city: city,
                state: state,
                zip_code: zipCode,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Update failed:", errorData);
            Alert.alert("Error", errorData.detail || "Failed to update profile.");
            return;
        }

        const updatedData = await response.json();
        Alert.alert("Success", "Your profile has been updated.");

    } catch (error) {
        console.error("Error updating profile:", error);
        Alert.alert("Error", "Failed to update profile.");
    }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
                testID="back-button"
                onPress={() => navigation.reset({ index: 0, routes: [{ name: "(tabs)", params: { screen: "home" } }]})}
                style={styles.headerIcon}
              >
                <ImageBackground
                  style={styles.backIcon}
                  source={require("@/assets/images/back-arrow.png")}
                  resizeMode="cover"
                />
              </TouchableOpacity>
      <Text style={styles.title}>Edit Profile</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Username:</Text>
        <TextInput
          style={[styles.input, styles.readOnly]}
          value={username}
          editable={false}
        />

        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={[styles.input, styles.readOnly]}
          value={firstName}
          editable={false}
        />

        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={[styles.input, styles.readOnly]}
          value={lastName}
          editable={false}
        />

        <Text style={styles.label}>Phone Number:</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Address:</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
        />

        <Text style={styles.label}>City:</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />

        <Text style={styles.label}>State:</Text>
        <TextInput
          style={styles.input}
          value={state}
          onChangeText={setState}
          placeholder="State"
        />

        <Text style={styles.label}>Zip Code:</Text>
        <TextInput
          style={styles.input}
          value={zipCode}
          onChangeText={setZipCode}
          placeholder="Zip Code"
          keyboardType="number-pad"
          maxLength={5}
        />
      </View>
      {/* Update Button */}
      <TouchableOpacity
        style={styles.updateButton}
        onPress={updateUserProfile}
        disabled={loading}
      >
        <Text style={styles.updateButtonText}>
          {loading ? "Updating..." : "Update Profile"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  headerIcon: { width: 20, height: 20 },
  backIcon: { width: 20, height: 20 },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  readOnly: {
    backgroundColor: '#f0f0f0',
  },
  updateButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditProfilePage;
