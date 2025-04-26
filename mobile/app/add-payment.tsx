import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddPayment() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Add a Payment Method</Text>
        <Text style={styles.subtext}>
          We'll redirect you to Stripe to securely add your card.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/add-card-webview')}
        >
          <Text style={styles.buttonText}>Add New Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  card: { padding: 24, alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  subtext: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#232323',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
