/// app/payment-method.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically load card type based on card info in storage
const getCardLogo = (cardType: string) => {
  switch (cardType.toLowerCase()) {
    case 'visa':
      return require('@/assets/images/card-logo/visa.png');
    case 'mastercard':
      return require('@/assets/images/card-logo/mastercard.png');
    case 'amex':
      return require('@/assets/images/card-logo/amex.png');
    case 'discover':
      return require('@/assets/images/card-logo/discover.png');
    default:
      return require('@/assets/images/card-logo/visa.png');
  }
};

export default function PaymentMethod() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);

  // Load card info from storage
  const loadCards = async () => {
    try {
      const stored = await AsyncStorage.getItem('storedCards');
      if (stored) {
        setCards(JSON.parse(stored));
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error('Error loading cards from storage', error);
    }
  };

  // Refresh data
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  // Set Default card：Set checked box as default = true，else = false
  const handleSetDefault = async (selectedIndex: number) => {
    const updatedCards = cards.map((card, index) => ({
      ...card,
      default: index === selectedIndex,
    }));
    setCards(updatedCards);
    try {
      await AsyncStorage.setItem('storedCards', JSON.stringify(updatedCards));
    } catch (error) {
      console.error('Error updating default card', error);
    }
  };

  // Delete card：update state, write back to AsyncStorage
  const handleDeleteCard = async (index: number) => {
    const updatedCards = cards.filter((_, i) => i !== index);
    setCards(updatedCards);
    try {
      await AsyncStorage.setItem('storedCards', JSON.stringify(updatedCards));
    } catch (error) {
      console.error('Error deleting card', error);
    }
  };

  // Delete comformation
  const confirmDelete = (index: number) => {
    Alert.alert(
      'Delete Card',
      'Are you sure to delete this card？',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleDeleteCard(index) },
      ],
      { cancelable: true }
    );
  };

  // Display 10 card maximum; add more logic when adding(todo)
  const renderedCards = cards.slice(0, 10);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <ImageBackground
            style={styles.backIcon}
            source={require('@/assets/images/back-arrow.png')}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment method</Text>
        <TouchableOpacity onPress={() => router.push('/add-payment')} style={styles.headerRight}>
          <ImageBackground
            style={styles.headerIconImage}
            source={require('@/assets/images/add-icon.png')}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.cardContainer}>
          {renderedCards.map((card, index) => (
            <View key={index} style={styles.cardWrapper}>
              <View style={styles.fancyCard}>
                {/* card num display **** + last 4 dig */}
                <Text style={styles.fancyCardNumber}>
                  <Text style={styles.maskedPart}>* * * * * * * * * * * </Text>
                  <Text style={styles.realPart}>{card.last4}</Text>
                </Text>
                {/* card background setting */}
                <View style={styles.cardBackground} />
                {/* Card type icon */}
                <Image
                  style={styles.decoration1}
                  source={getCardLogo(card.cardType || 'visa')} // set defalut as visa, try some new pic
                  resizeMode="contain"
                />

             
                {/* Label */}
                <Text style={styles.labelCardHolder} numberOfLines={1}>
                  Card Holder Name
                </Text>
                <Text style={styles.labelExpiry} numberOfLines={1}>
                  Expiry Date
                </Text>
                <Text style={styles.valueCardHolder} numberOfLines={1}>
                  {card.cardHolder}
                </Text>
                <Text style={styles.valueExpiry} numberOfLines={1}>
                  {card.expiry}
                </Text>
              </View>
              {/* default and delete */}
              <View style={styles.defaultContainer}>
                <TouchableOpacity onPress={() => handleSetDefault(index)} style={styles.checkbox}>
                  {card.default && <View style={styles.checked} />}
                </TouchableOpacity>
                <Text style={styles.defaultText}>Use as default payment method</Text>
                <TouchableOpacity onPress={() => confirmDelete(index)} style={styles.defaultDeleteButton}>
                  <Image
                    source={require('@/assets/images/delete.png')}
                    style={styles.defaultDeleteIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  headerIcon: { width: 20, height: 20 },
  backIcon: { width: 20, height: 20 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Merriweather',
    fontSize: 16,
    fontWeight: '700',
    color: '#303030',
  },
  headerRight: { width: 20, height: 20 },
  headerIconImage: { width: 20, height: 20 },
  scrollView: { flex: 1 },
  cardContainer: { marginTop: 20, paddingHorizontal: 16 },
  cardWrapper: { marginBottom: 20, alignItems: 'center' },
  fancyCard: {
    width: 333,
    height: 180,
    position: 'relative',
  },
  fancyCardNumber: {
    width: 239,
    height: 27,
    fontFamily: 'Metropolis',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 23.438,
    position: 'relative',
    textAlign: 'left',
    zIndex: 3,
    marginTop: 62.612,
    marginLeft: 25,
  },
  maskedPart: {
    fontFamily: 'Nunito Sans',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27.28,
    color: '#ffffff',
    textAlign: 'left',
  },
  realPart: {
    fontFamily: 'Nunito Sans',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 27.28,
    color: '#ffffff',
    textAlign: 'left',
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#232323',
    borderRadius: 7.77,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  decoration1: {
    width: '30%',
    height: '30%',
    position: 'absolute',
    top: '1%',
    left: '70%',
    zIndex: 1,
  },

  labelCardHolder: {
    width: '30.63%',
    height: '8.89%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: 'Nunito Sans',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
    lineHeight: 16,
    color: '#ffffff',
    position: 'absolute',
    top: '65.4%',
    left: '7.21%',
    textAlign: 'center',
    zIndex: 4,
  },
  labelExpiry: {
    height: '8.89%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontFamily: 'Nunito Sans',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
    lineHeight: 16,
    color: '#ffffff',
    position: 'absolute',
    top: '65.4%',
    left: '68.77%',
    textAlign: 'left',
    zIndex: 5,
  },
  valueCardHolder: {
    height: '10.56%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontFamily: 'Nunito Sans',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: '#ffffff',
    letterSpacing: -0.4,
    position: 'absolute',
    top: '76.76%',
    left: '7.51%',
    textAlign: 'left',
    zIndex: 6,
  },
  valueExpiry: {
    height: '10.56%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontFamily: 'Nunito Sans',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: '#ffffff',
    letterSpacing: -0.4,
    position: 'absolute',
    top: '76.76%',
    left: '68.77%',
    textAlign: 'left',
    zIndex: 7,
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: 333,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: '#232323',
  },
  defaultText: {
    fontSize: 14,
    color: '#303030',
    flex: 1,
  },
  defaultDeleteButton: {
    padding: 4,
  },
  defaultDeleteIcon: {
    width: 20,
    height: 20,
    tintColor: 'red',
  },
});
