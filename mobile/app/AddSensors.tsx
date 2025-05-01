import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() ?? 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddRegisterSensor() {
  const [mode, setMode] = useState<'add' | 'register'>('add');
  const [sensorId, setSensorId] = useState('');
  const [nickname, setNickname] = useState('');
  const [sensorType, setSensorType] = useState<'air' | 'soil'>('air');
  const [address, setAddress] = useState('');
  const googleRef = useRef<GooglePlacesAutocompleteRef>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;

    const payload: any = { sensor_id: sensorId, nickname };
    if (mode === 'register') {
      payload.sensor_type = sensorType;
      payload.address = address;
    }

    const endpoint = mode === 'add' ? '/api/sensors/add/' : '/api/sensors/register/';
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Something went wrong');
    } else {
      alert(json.message);
      setSensorId('');
      setNickname('');
      setAddress('');

      navigation.reset({
        index: 0,
        routes: [{ name: "(tabs)", params: { screen: "home" } }],
      });
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / 2;
  const indicatorLeft = mode === 'add' ? 0 : tabWidth;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        style={{ flex: 1 }}
      >
        <View style={styles.tabHeader}>
          <View style={styles.tabRow}>
            <TouchableOpacity style={styles.tabButton} onPress={() => setMode('add')}>
              <Text style={mode === 'add' ? styles.tabTextActive : styles.tabText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabButton} onPress={() => setMode('register')}>
              <Text style={mode === 'register' ? styles.tabTextActive : styles.tabText}>Register</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.tabIndicator, { left: indicatorLeft }]} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Sensor ID</Text>
          <TextInput
            style={styles.input}
            value={sensorId}
            onChangeText={setSensorId}
            placeholder="Enter sensor ID"
          />

          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Optional nickname"
          />

          {mode === 'register' && (
            <>
              <Text style={styles.label}>Sensor Type</Text>
              <View style={styles.radioGroup}>
                {['air', 'soil'].map((type) => (
                  <TouchableOpacity key={type} onPress={() => setSensorType(type as 'air' | 'soil')}>
                    <Text style={sensorType === type ? styles.radioSelected : styles.radioUnselected}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Address</Text>
              <GooglePlacesAutocomplete
                ref={googleRef}
                placeholder="Search for address"
                fetchDetails
                onPress={(data) => {
                  setAddress(data.description);
                }}
                query={{
                  key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
                  language: 'en',
                }}
                styles={{
                  textInput: styles.input,
                  container: { flex: 0, marginBottom: 10 },
                }}
                enablePoweredByContainer={false}
                textInputProps={{
                  onChangeText: setAddress,
                }}
              />
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>
              {mode === 'add' ? 'Add Sensor' : 'Register Sensor'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabHeader: {
    width: '100%',
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginTop: 20,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingBottom: 10,
  },
  tabButton: {
    width: '50%',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#999',
  },
  tabTextActive: {
    fontSize: 18,
    fontWeight: '700',
    color: '#232323',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: Dimensions.get('window').width / 2,
    height: 4,
    backgroundColor: '#232323',
    borderRadius: 4,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  radioSelected: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  radioUnselected: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
