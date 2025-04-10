import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Alert} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const AddCardWebview = () => {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const startCheckout = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout-session/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: API_BASE_URL
        })
      });

      const data = await response.json();
      console.log('Checkout URL:', data);
      if (data.checkout_url) {
        setCheckoutUrl(data.checkout_url);
      }
    };

    startCheckout();
  }, []);

  const handleNavigation = (navState: any) => {
    const { url } = navState;

    if (url.includes('/payment-success')) {
      console.log('Payment success! Closing WebView.');
      navigation.goBack();
      navigation.goBack(); // Close the WebView
      Alert.alert('Success', 'Your payment method has been saved.');
    }

    if (url.includes('/payment-cancel')) {
      console.log('Payment canceled.');
      navigation.goBack();
    }
  };

  if (!checkoutUrl) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <WebView
      source={{ uri: checkoutUrl }}
      onNavigationStateChange={handleNavigation}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
    />
  );
};

export default AddCardWebview;