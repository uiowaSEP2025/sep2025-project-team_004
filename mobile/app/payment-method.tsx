// app/payment-method.tsx
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
// Use expo-router instead of react-navigation to match test expectations
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically load card logo
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

const API_URL = "http://127.0.0.1:8000/api/payment/payment-methods/";

export default function PaymentMethod() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [defaultPaymentId, setDefaultPaymentId] = useState<number | null>(null);

  // Load card info from API
  const loadCards = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }
  
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Authorization": `Token ${authToken}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods.");
      }
  
      const data = await response.json();
      const defaultCard = data.find((card: any) => card.is_default);
      setDefaultPaymentId(defaultCard ? defaultCard.id : null);
      setCards(
        data.map((card: any) => ({
          ...card,
          is_default: card.is_default ?? false,
        }))
      ); 
    } catch (error) {
      console.error("Error loading payment methods:", error);
      Alert.alert("Error", "Failed to load payment methods.");
    }
  };

  // Call loadCards when the screen is focused
  // (Assuming expo-router calls useFocusEffect similarly)
  React.useEffect(() => {
    loadCards();
  }, []);

  // Set default payment card and update storage
  const handleSetDefault = async (selectedIndex: number) => {
    try {
      const selectedCardId = cards[selectedIndex].id;
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("User not authenticated");
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/payment/set-default/${selectedCardId}/`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Token ${token}`,
          },
      });

      if (!response.ok) {
          console.error("Failed to set default payment method");
          return;
      }

      setDefaultPaymentId(selectedCardId);
      const updatedCards = cards.map((card, index) => ({
        ...card,
        is_default: index === selectedIndex,
      }));
      setCards(updatedCards);
      await AsyncStorage.setItem('storedCards', JSON.stringify(updatedCards));
    } catch (error) {
      console.error("Error updating default payment method:", error);
    }
  };

  // Show confirmation alert when delete button is pressed
  const confirmDelete = (id: number) => {
    Alert.alert(
      'Delete Card',
      'Are you sure to delete this card？',
      [
        { text: 'Yes', onPress: () => handleDeleteCard(id) },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleDeleteCard = async (id: number) => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
          console.error("User not authenticated.");
          return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/payment/delete/${id}/`, {
          method: "DELETE",
          headers: {
              "Authorization": `Token ${authToken}`,
              "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete payment method.");
      }

      setCards(cards.filter((card) => card.id !== id)); 
    } catch (error) {
      console.error("Error deleting payment method:", error);
    }
  };

  // Only display up to 10 cards
  const renderedCards = cards.slice(0, 10);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-button"
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <ImageBackground
            style={styles.backIcon}
            source={require("@/assets/images/back-arrow.png")}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment method</Text>
        <TouchableOpacity
          testID="add-payment-button"
          onPress={() => router.push('/add-payment')}
          style={styles.headerRight}
        >
          <ImageBackground
            style={styles.headerIconImage}
            source={require("@/assets/images/add-icon.png")}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
  
      {/* Main Content */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.cardContainer}>
          {renderedCards.map((card, index) => (
            <View key={index} style={styles.cardWrapper}>
              <View style={styles.fancyCard}>
                {/* Card number display */}
                <Text style={styles.fancyCardNumber}>
                  <Text style={styles.maskedPart}>* * * * * * * * * * * </Text>
                  <Text style={styles.realPart}>{card.last4}</Text>
                </Text>
                <View style={styles.cardBackground} />
                <Image
                  style={styles.decoration1}
                  source={getCardLogo(card.cardType || "visa")}
                  resizeMode="contain"
                />
                {/* Labels */}
                <Text style={styles.labelCardHolder} numberOfLines={1}>
                  Card Holder Name
                </Text>
                <Text style={styles.labelExpiry} numberOfLines={1}>
                  Expiry Date
                </Text>
                <Text style={styles.valueCardHolder} numberOfLines={1}>
                  {card.cardholder_name}
                </Text>
                <Text style={styles.valueExpiry} numberOfLines={1}>
                  {card.expiration_date}
                </Text>
              </View>
  
              {/* Default & Delete Controls */}
              <View style={styles.defaultContainer}>
                <TouchableOpacity
                  testID={`default-checkbox-${index}`}
                  onPress={() => handleSetDefault(index)}
                  style={styles.checkbox}
                >
                  {card.id === defaultPaymentId && <View style={styles.checked} />}
                </TouchableOpacity>
  
                <View>
                  <Text style={styles.defaultText}>Use as default payment method</Text>
                </View>
  
                <TouchableOpacity
                  testID={`delete-button-${card.id}`}
                  onPress={() => confirmDelete(card.id)}
                  style={[styles.defaultDeleteButton, card.is_default && styles.disabledButton]} 
                  disabled={card.is_default}
                >
                  <Image
                    source={require("@/assets/images/delete.png")}
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
  disabledButton: {
    opacity: 0.5,
  },
});
