// app/payment-method.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function PaymentMethod() {
  const navigation = useNavigation();

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');

  // Process the card number, start with “*”
  const totalDigits = 16;
  const sanitizedCardNumber = cardNumber.replace(/\s/g, '');
  const maskedNumber =
    sanitizedCardNumber +
    '*'.repeat(Math.max(totalDigits - sanitizedCardNumber.length, 0));
  const formattedCardNumber =
    maskedNumber.match(/.{1,4}/g)?.join(' ') || '';

  const handleCardNumberChange = (text: string) => {
    // LIMIT 16 digits, dig only
    const digits = text.replace(/\D/g, '').slice(0, 16);
  
    // add space every 4 digits
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || '';
  
    setCardNumber(formatted);
  };
  // Expiry Date Input：Only allow digits, 2 digits , then "/"，then 2 digits 
  const handleExpiryChange = (text: string) => {
    const digits = text.replace(/\D/g, ''); //only keep digits
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4);
    }
    if (formatted.length > 5) {
      formatted = formatted.slice(0, 5);
    }
    setExpiry(formatted);
  };

  // Add card, for now, just return
  const handleAddCard = () => {
    //TODO: Add the card, talk to the backend, verfy the card, get feedback, show status, and return
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.screen}>
          {/* Header */}
          <View style={styles.header}>
            {/* TODO: change onPress */}
            <TouchableOpacity onPress={handleAddCard}>
              <ImageBackground
                style={styles.backIcon}
                source={require('@/assets/images/back-arrow.png')}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Add payment method
            </Text>
            <TouchableOpacity onPress={handleAddCard}>
              <Text style={styles.addText} numberOfLines={1}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Credit Card Display */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Card Number */}
              <View style={styles.cardNumberContainer}>
                <Text style={styles.masked}>{formattedCardNumber}</Text>
              </View>
              {/* Card info */}
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

          {/* Input Area */}
          <View style={styles.formContainer}>
          <TextInput
            placeholder="Card Number"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="numeric"
            value={cardNumber}
            onChangeText={handleCardNumberChange}
          />
            <TextInput
              placeholder="Card Holder Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={cardHolder}
              onChangeText={setCardHolder}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="Expiry Date"
                placeholderTextColor="#999"
                style={[styles.input, styles.inputHalf]}
                keyboardType="numeric"
                value={expiry}
                onChangeText={handleExpiryChange}
              />
              <TextInput
                placeholder="CVV"
                placeholderTextColor="#999"
                style={[styles.input, styles.inputHalf]}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* ADD NEW CARD */}
          <TouchableOpacity onPress={handleAddCard}>
            <View style={styles.addCardContainer}>
              <Text style={styles.addCardText}>ADD NEW CARD</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screen: {
    width: 375,
    height: 812,
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  // Header 
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginTop: 12,
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
  addText: {
    fontSize: 16,
    color: '#007AFF',
  },
  // Card
  cardContainer: {
    width: 333,
    height: 180,
    marginTop: 22,
    marginLeft: 21,
    position: 'relative',
  },
  card: {
    flex: 1,
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 16,
  },
  cardNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  masked: {
    fontFamily: 'Nunito Sans',
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Card button info - 2 col
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  detailsColumn: {
    flex: 1,
  },
  label: {
    fontFamily: 'Nunito Sans',
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.8,
  },
  value: {
    fontFamily: 'Nunito Sans',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  // Filling area
  formContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontFamily: 'Nunito Sans',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  // ADD NEW CARD button
  addCardContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    height: 60,
    backgroundColor: '#232323',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardText: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
