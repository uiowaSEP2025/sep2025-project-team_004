import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ImageBackground,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import showMessage from '../hooks/useAlert';

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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }
      setUsername(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.username);
      setFirstName(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.first_name);
      setLastName(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.last_name);
      setPhone(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.phone_number);
      setAddress(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.address);
      setCity(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.city);
      setState(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.state);
      setZipCode(JSON.parse(await AsyncStorage.getItem('userInfo') || '{}')?.zip_code);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'An error occurred while loading user profile.');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const updateUserProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "User is not authenticated.");
        return;
      }
  
      // Step 1: Validate the address
      const validationRes = await fetch(`${API_BASE_URL}/api/users/validate-address/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address,
          city: city,
          state: state,
          zip_code: zipCode,
        }),
      });
  
      const validationData = await validationRes.json();
  
      if (!validationRes.ok || !validationData.valid) {
        Alert.alert("Invalid Address", validationData.message || "Please double-check your address.");
        return;
      }
  
      // Step 2: Set the standardized version
      setAddress(validationData.standardized.address);
      setCity(validationData.standardized.city);
      setState(validationData.standardized.state);
      setZipCode(validationData.standardized.zip_code);
  
      // Step 3: Proceed to update profile
      const updateRes = await fetch(`${API_BASE_URL}/api/users/profile/update/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          address: validationData.standardized.address,
          city: validationData.standardized.city,
          state: validationData.standardized.state,
          zip_code: validationData.standardized.zip_code,
        }),
      });
  
      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        console.error("Update failed:", errorData);
        Alert.alert("Error", errorData.detail || "Failed to update profile.");
        return;
      }
  
      const updatedUser = await updateRes.json();
      await AsyncStorage.setItem("userInfo", JSON.stringify(updatedUser));
      useToast("Success", "Your profile has been updated.");
  
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("home");
      }
  
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            testID="back-button"
            onPress={() => navigation.goBack()} style={styles.backButton}>
            <ImageBackground
              source={require('@/assets/images/back-arrow.png')}
              style={styles.backIcon}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Edit Profile
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.formContainer}>
          <View style={[styles.card, styles.readOnlyCard]}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.lockedValue}>{username}</Text>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.card, styles.readOnlyCard, styles.halfCard]}>
              <Text style={styles.label}>First Name</Text>
              <Text style={styles.lockedValue}>{firstName}</Text>
            </View>
            <View style={[styles.card, styles.readOnlyCard, styles.halfCard]}>
              <Text style={styles.label}>Last Name</Text>
              <Text style={styles.lockedValue}>{lastName}</Text>
            </View>
          </View>

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

          <View style={styles.card}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="State"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="Zip Code"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        <TouchableOpacity onPress={updateUserProfile} disabled={loading} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>
            {loading ? 'Validating Address...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    width: 375,
    minHeight: 812,
    backgroundColor: '#ffffff',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginTop: 20,
  },
  backButton: {
    width: 20,
    height: 20,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Merriweather',
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
