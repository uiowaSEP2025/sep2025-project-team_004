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
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import showMessage from '../hooks/useAlert';
import * as ImagePicker from 'expo-image-picker';

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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo') || '{}');
      setUsername(userInfo?.username);
      setFirstName(userInfo?.first_name);
      setLastName(userInfo?.last_name);
      setPhone(userInfo?.phone_number);
      setAddress(userInfo?.address);
      setCity(userInfo?.city);
      setState(userInfo?.state);
      setZipCode(userInfo?.zip_code);
      setProfilePicture(userInfo?.profile_picture || null);
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

  const pickImage = async () => {
    try {
      // Request permission to access image library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }
      
      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Upload the selected image
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }
      
      // Create form data for the upload
      const formData = new FormData();
      const fileType = imageUri.split('.').pop() || 'jpg';
      const fileName = `profile-${Date.now()}.${fileType}`;
      
      // @ts-ignore - TypeScript doesn't properly type FormData for React Native
      formData.append('profile_picture', {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      });
      
      // Send the request to the backend
      const response = await fetch(`${API_BASE_URL}/api/users/upload-profile-picture/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload profile picture');
      }
      
      // Update local state with the new profile picture URL
      setProfilePicture(data.profile_picture);
      
      // Update the user info in AsyncStorage
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo') || '{}');
      userInfo.profile_picture = data.profile_picture;
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      useToast('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture.');
    } finally {
      setUploadingImage(false);
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

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
          <View style={styles.formContainer}>
            {/* Profile Picture */}
            <View style={styles.profilePictureContainer}>
              <TouchableOpacity onPress={pickImage} disabled={uploadingImage}>
                {profilePicture ? (
                  <Image 
                    source={{ uri: profilePicture }} 
                    style={styles.profilePicture} 
                  />
                ) : (
                  <Image 
                    source={require('@/assets/images/default-pfp.png')} 
                    style={styles.profilePicture} 
                  />
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#ffffff" />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              </TouchableOpacity>
            </View>

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

            {/* Update Profile Button */}
            <TouchableOpacity 
              onPress={updateUserProfile} 
              disabled={loading} 
              style={styles.loginButton}>
              <Text style={styles.loginButtonText}>
                {loading ? 'Validating Address...' : 'Update Profile'}
              </Text>
            </TouchableOpacity>
            
            {/* Safe bottom spacing */}
            <View style={{ height: 80 }} />
          </View>
        </ScrollView>
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
    flex: 1,
    backgroundColor: '#ffffff',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80, // Safe padding for bottom area
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#232323',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editIcon: {
    fontSize: 16,
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
    width: '90%',
    height: 50,
    backgroundColor: '#232323',
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
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
