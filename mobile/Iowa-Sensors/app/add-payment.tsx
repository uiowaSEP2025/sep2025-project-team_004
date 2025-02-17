// app/payment-method.tsx

import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';

export default function PaymentMethod() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        scrollEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.screen}>

          {/* Header */}
          <View style={styles.header}>
            <ImageBackground
              style={styles.backIcon}
              source={require('@/assets/images/back-arrow.png')}
              resizeMode="cover"
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              Add payment method
            </Text>
            <Text style={styles.addText} numberOfLines={1}>
              Done
            </Text>
          </View>

          {/* Credit Card Region */}
            <View style={styles.cardContainer}>
            <View style={styles.card}>
                {/* Card Number */}
                <View style={styles.cardNumberContainer}>
                <Text style={styles.masked}>* * * * * * * * * * * *</Text>
                <Text style={styles.lastDigits}>XXXX</Text>
                </View>
                {/* Card Details */}
                <View style={styles.cardDetails}>
                <Text style={styles.cardHolderLabel} numberOfLines={1}>
                    Card Holder Name
                </Text>
                <Text style={styles.expiryLabel} numberOfLines={1}>
                    Expiry Date
                </Text>
                <View style={styles.detailsRow}>
                    <Text style={styles.cardHolder} numberOfLines={1}>
                    Jennyfer Doe
                    </Text>
                    <Text style={styles.cardExpiry} numberOfLines={1}>
                    05/23
                    </Text>
                </View>
                </View>
            </View>
            </View>


          {/* Input area */}
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Card Number"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Card Holder Name"
              placeholderTextColor="#999"
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="Expiry Date"
                placeholderTextColor="#999"
                style={[styles.input, styles.inputHalf]}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="CVV"
                placeholderTextColor="#999"
                style={[styles.input, styles.inputHalf]}
                keyboardType="numeric"
              />
            </View>
            {/* ...more */}
          </View>
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
  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginHorizontal: 20,
    height: 18,
  },
  statusTime: {
    fontFamily: 'SF Pro Text', // add this font
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
    color: '#000000',
    letterSpacing: -0.17,
    textAlign: 'center',
  },
  statusIcons: {
    width: 67,
    height: 11.5,
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
  forwardIcon: {
    width: 20,
    height: 20,
  },
  addText: {
    fontSize: 16,
    color: '#007AFF',
  },
  // Card view
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
  lastDigits: {
    fontFamily: 'Nunito Sans',
    fontSize: 20,
    fontWeight: '400',
    color: '#ffffff',
    marginLeft: 8,
  },
  cardDetails: {
    // name and valid time
  },
  cardHolderLabel: {
    fontFamily: 'Nunito Sans',
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  expiryLabel: {
    fontFamily: 'Nunito Sans',
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHolder: {
    fontFamily: 'Nunito Sans',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardExpiry: {
    fontFamily: 'Nunito Sans',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
});
