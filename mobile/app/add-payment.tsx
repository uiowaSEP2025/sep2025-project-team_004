// app/add-payment.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  SafeAreaView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import Constants from 'expo-constants';
import showMessage from '../hooks/useAlert';
import { useRouter } from 'expo-router';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const originalConsoleError = console.error;

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('VirtualizedLists should never be nested inside plain ScrollViews')
  ) {
    return;
  }
  originalConsoleError(...args);
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() ?? 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const cardLogos: { [key: string]: any } = {
  amex: require('@/assets/images/card-logo/amex.png'),
  discover: require('@/assets/images/card-logo/discover.png'),
  mastercard: require('@/assets/images/card-logo/mastercard.png'),
  visa: require('@/assets/images/card-logo/visa.png'),
};

export default function PaymentMethod() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { useToast } = showMessage();
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [addressInput, setAddressInput] = useState('');
  const addressRef = useRef<any>(null);

  const sanitizedCardNumber = cardNumber.replace(/\s/g, '');
  const totalDigits = 16;
  const maskedNumber = sanitizedCardNumber + '*'.repeat(Math.max(totalDigits - sanitizedCardNumber.length, 0));
  const formattedCardNumber = maskedNumber.match(/.{1,4}/g)?.join(' ') || '';

  const getCardType = (number: string) => {
    const sanitized = number.replace(/\s/g, '');
    if (/^5[1-5]/.test(sanitized)) return 'mastercard';
    if (/^6(?:011|5)/.test(sanitized)) return 'discover';
    if (/^3[47]/.test(sanitized)) return 'amex';
    if (/^4/.test(sanitized)) return 'visa';
    return '';
  };

  const handleCardNumberChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4);
    if (formatted.length > 5) formatted = formatted.slice(0, 5);
    setExpiry(formatted);
  };

  const detectedCardType = getCardType(sanitizedCardNumber);

  const handleAddCard = async () => {
    const [exp_month, exp_year] = expiry.split('/');
    const email = await AsyncStorage.getItem('userEmail');

    const payload = {
      card: {
        number: sanitizedCardNumber,
        exp_month,
        exp_year: `20${exp_year}`,
        cvc,
      },
      billing_details: {
        name: cardHolder,
        email,
        address: {
          line1: address,
          city,
          state,
          postal_code: postalCode,
          country: 'US',
        },
      },
    };

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/payment/create-stripe-payment-method/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to add payment method');
      useToast('Success', 'Your payment method has been added');
      router.replace('/payment-method');
    } catch (err) {
      Alert.alert('Error', 'There was an error adding your card.');
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        extraScrollHeight={120}
      >
        <View style={styles.screen}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ImageBackground
                style={styles.backIcon}
                source={require('@/assets/images/back-arrow.png')}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add payment method</Text>
            <TouchableOpacity onPress={handleAddCard}>
              <Text style={styles.addText}>Done</Text>
            </TouchableOpacity>
          </View>
  
          {/* Card Display */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <View style={styles.cardNumberContainer}>
                <Text style={styles.masked}>{formattedCardNumber}</Text>
                {detectedCardType ? (
                  <Image
                    style={styles.cardLogo}
                    source={cardLogos[detectedCardType]}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.detailsColumn}>
                  <Text style={styles.label}>CARD HOLDER</Text>
                  <Text style={styles.value}>{cardHolder}</Text>
                </View>
                <View style={styles.detailsColumn}>
                  <Text style={styles.label}>EXP DATE</Text>
                  <Text style={styles.value}>{expiry}</Text>
                </View>
              </View>
            </View>
          </View>
  
          {/* Form */}
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Card Number"
              style={styles.input}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Card Holder Name"
              style={styles.input}
              value={cardHolder}
              onChangeText={setCardHolder}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="Expiry Date"
                placeholderTextColor="#999"
                style={[styles.input, styles.inputHalf]}
                value={expiry}
                onChangeText={handleExpiryChange}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="CVV"
                placeholderTextColor="#999"
                style={[styles.input, styles.inputHalf]}
                value={cvc}
                onChangeText={setCvc}
                keyboardType="numeric"
              />
            </View>
  
            {/* Google Places */}
            <GooglePlacesAutocomplete
              ref={addressRef}
              placeholder="Enter billing address"
              fetchDetails
              onPress={(data, details = null) => {
                if (details) {
                  const getComponent = (type: string) =>
                    details.address_components.find(c => c.types.includes(type as any))?.long_name || '';
                  const fullAddress = `${getComponent('street_number')} ${getComponent('route')}`.trim();
                  setAddress(fullAddress);
                  setAddressInput(fullAddress);
                  setCity(getComponent('locality') || getComponent('sublocality') || getComponent('postal_town'));
                  setState(getComponent('administrative_area_level_1'));
                  setPostalCode(getComponent('postal_code'));
  
                  setTimeout(() => {
                    addressRef.current?.setAddressText(fullAddress);
                  }, 100);
                }
              }}
              query={{
                key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
                language: 'en',
                components: 'country:us',
              }}
              textInputProps={{
                value: addressInput,
                onChangeText: (text) => setAddressInput(text),
                placeholderTextColor: '#999',
              }}
              styles={{
                container: {
                  flex: 0,
                  zIndex: 1000,
                },
                textInput: styles.input,
                listView: {
                  zIndex: 2000,
                  backgroundColor: 'white',
                  borderColor: '#ddd',
                  borderWidth: 1,
                  elevation: 5,
                  maxHeight: 200,
                },
              }}
            />
          </View>
  
          {/* Submit Button */}
          <View style={styles.addCardContainer}>
            <TouchableOpacity onPress={handleAddCard}>
              <Text style={styles.addCardText}>ADD NEW CARD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  screen: { width: 375, height: 812, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', marginTop: 12 },
  backIcon: { width: 20, height: 20 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#303030' },
  addText: { fontSize: 17, color: '#007AFF' },
  cardContainer: { width: 333, height: 180, marginTop: 22, marginLeft: 21 },
  card: { flex: 1, backgroundColor: '#232323', borderRadius: 8, padding: 16 },
  cardNumberContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  masked: { fontSize: 20, fontWeight: '600', color: '#fff' },
  cardLogo: { position: 'absolute', top: 20, right: 0, width: 80, height: 80 },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 16, left: 16, right: 16 },
  detailsColumn: { flex: 1 },
  label: { fontSize: 10, fontWeight: '600', color: '#fff', opacity: 0.8 },
  value: { fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 4 },
  formContainer: { marginTop: 20, paddingHorizontal: 16 },
  input: { height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, paddingHorizontal: 12, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputHalf: { width: '48%' },
  addCardContainer: { marginTop: 30, marginHorizontal: 16, height: 60, backgroundColor: '#232323', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addCardText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
