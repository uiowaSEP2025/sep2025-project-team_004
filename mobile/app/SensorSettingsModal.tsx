
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() ?? 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

interface Props {
  visible: boolean;
  onClose: () => void;
  sensor: any;
  currentUserId: number | null;
  onUpdate: () => void;
}

const SensorSettingsModal: React.FC<Props> = ({ visible, onClose, sensor, currentUserId, onUpdate }) => {
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [belongsToUser, setBelongsToUser] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (sensor) {
      setNickname(sensor.nickname || '');
      setAddress(sensor.address || '');
      setIsDefault(sensor.is_default || false);
      setBelongsToUser(sensor.belongs_to === currentUserId);
    }
  }, [sensor, currentUserId]);

  const handleSave = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;
  
    try {
      const favPayload: any = {
        nickname,
        is_default: isDefault,
      };
  
      const favRes = await fetch(`${API_BASE_URL}/api/sensors/${sensor.sensor_id}/update-favorite/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favPayload),
      });
  
      if (!favRes.ok) {
        const err = await favRes.json();
        throw new Error(err.error || 'Failed to update favorite sensor');
      }
  
      if (belongsToUser) {
        const belongsPayload = { address };
  
        const belongsRes = await fetch(`${API_BASE_URL}/api/sensors/${sensor.sensor_id}/update-belongs/`, {
          method: 'PATCH',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(belongsPayload),
        });
  
        if (!belongsRes.ok) {
          const err = await belongsRes.json();
          throw new Error(err.error || 'Failed to update sensor location');
        }
      }
  
      onUpdate();
      onClose();
      navigation.reset({
        index: 0,
        routes: [{ name: "(tabs)", params: { screen: "home" } }],
      });
  
    } catch (err: any) {
      alert(err.message || 'Something went wrong.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Sensor Settings</Text>
          <Text style={styles.label}>Sensor ID</Text>
          <Text style={styles.readOnly}>{sensor.sensor_id}</Text>

          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
          />

          <View style={styles.defaultRow}>
            <Text style={styles.label}>Set as default</Text>
            <Switch
              value={isDefault}
              onValueChange={(val) => setIsDefault(val)}
            />
          </View>

          {belongsToUser && (
            <>
              <Text style={styles.label}>Address</Text>
              <GooglePlacesAutocomplete
                placeholder="Update sensor location"
                fetchDetails
                onPress={(data) => setAddress(data.description)}
                query={{
                  key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
                  language: 'en',
                }}
                styles={{
                  textInput: styles.input,
                  container: { flex: 0 },
                }}
                textInputProps={{
                  value: address,
                  onChangeText: setAddress,
                }}
              />
            </>
          )}

          <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  readOnly: {
    fontSize: 14,
    paddingVertical: 8,
    color: '#555',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelText: {
    color: '#000',
    fontWeight: '600',
  },
});

export default SensorSettingsModal;
