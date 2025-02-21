import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';

const EditProfilePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [username] = useState('john_doe'); 
  const [firstName] = useState('John'); 
  const [lastName] = useState('Doe'); 
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Form Validation
  const validateForm = () => {
    if (!phone || !address || !city || !state || !zipCode) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return false;
    }

    // Phone Number Validation (Basic)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number (10 digits).');
      return false;
    }

    // Zip Code Validation (Basic US Format)
    const zipRegex = /^[0-9]{5}$/;
    if (!zipRegex.test(zipCode)) {
      Alert.alert('Error', 'Please enter a valid zip code (5 digits).');
      return false;
    }

    return true;
  };

  // Handle Save
  const handleSave = () => {
    if (validateForm()) {
      Alert.alert('Success', 'Profile updated successfully!');
      // TODO: Implement save functionality (e.g., API call or state update)
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    Alert.alert('Cancel Changes', 'Discard all changes?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => {
          setPhone('');
          setAddress('');
          setCity('');
          setState('');
          setZipCode('');
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    width: Dimensions.get("window").width * 0.2,
    alignContent: 'center',
    alignSelf: 'center',
  },
  readOnly: {
    backgroundColor: '#f0f0f0',
    color: '#888',
    width: Dimensions.get("window").width * 0.2,
    alignContent: 'center',
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default EditProfilePage;
