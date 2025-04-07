import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ImageBackground, Platform
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import showMessage from "../hooks/useAlert";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const EditProfilePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { useToast } = showMessage();

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

      const response = await fetch(`http://${API_BASE_URL}:8000/api/users/profile/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load user profile");

      const userData = await response.json();

      setUsername(userData.username);
      setFirstName(userData.first_name);
      setLastName(userData.last_name);
      setPhone(userData.phone_number || "");
      setAddress(userData.address || "");
      setCity(userData.city || "");
      setState(userData.state || "");
      setZipCode(userData.zip_code || "");
    } catch (err) {
      console.error("Error fetching user profile:", err);
      Alert.alert("Error", "An error occurred while loading your profile.");
    }
  };
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

      const response = await fetch(`http://${API_BASE_URL}:8000/api/users/profile/update/`, {
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

      useToast("Success", "Your profile has been updated.");
      navigation.goBack();
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Error", "Failed to update profile.");
    }
  };
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        testID="back-button"
        onPress={() =>
          navigation.reset({ index: 0, routes: [{ name: "(tabs)", params: { screen: "profile" } }] })
        }
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
        <TextInput style={[styles.input, styles.readOnly]} value={username} editable={false} />

        <Text style={styles.label}>First Name:</Text>
        <TextInput style={[styles.input, styles.readOnly]} value={firstName} editable={false} />

        <Text style={styles.label}>Last Name:</Text>
        <TextInput style={[styles.input, styles.readOnly]} value={lastName} editable={false} />

          <View style={styles.card}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

        <Text style={styles.label}>Address:</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street Address"
        />

        <Text style={styles.label}>City:</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />

        <Text style={styles.label}>State:</Text>
        <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="State" />

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

      <TouchableOpacity style={styles.updateButton} onPress={updateUserProfile} disabled={loading}>
        <Text style={styles.updateButtonText}>
          {loading ? "Updating..." : "Update Profile"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 15,
  },
  form: {
    marginBottom: 20,
  },
  headerIcon: {
    width: 30,
    height: 30,
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  backIcon: { width: 20, height: 30, left: 3 },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303030',
  },
  placeholder: {
    width: 20,
    height: 20,
  },
  formContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 15,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  readOnlyCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 5,
  },
  lockedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#808080',
  },
  input: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
    padding: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCard: {
    width: '48%',
  },
  loginButton: {
    width: 285,
    height: 50,
    backgroundColor: '#232323',
    borderRadius: 8,
    marginTop: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  loginButtonText: {
    fontFamily: 'Nunito Sans',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24.552,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default EditProfilePage;
