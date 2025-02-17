// app/payment-method.tsx

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';


// Hide system header
export const unstable_settings = {
    headerShown: false,
};

export default function PaymentMethod() {
  const router = useRouter();
  

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
        <View style={styles.headerRight}>
          <ImageBackground
            style={styles.headerIconImage}
            source={require('@/assets/images/add-icon.png')} 
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Main content */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.cardContainer}>
          {/* Credit Card Box */}
          <View style={styles.card}>
            <Text style={styles.cardText}>**** **** **** 3947</Text>
            <Text style={styles.cardHolder}>Sheng Wang</Text>
          </View>
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
  card: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cardText: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  cardHolder: { color: '#ffffff', fontSize: 14, marginTop: 8 },
});
