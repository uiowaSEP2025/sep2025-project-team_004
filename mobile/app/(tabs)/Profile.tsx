// app/(tabs)/Profile.tsx

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export const unstable_settings = {
  title: 'Profile',
  tabBarIcon: ({ color }: { color: string }) => (
    <IconSymbol name="person.fill" size={28} color={color} />
  ),
};

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          {/* Search Icon */}
          <IconSymbol name="magnifyingglass" size={24} color="#303030" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.headerIcon}>
          {/* Logout Button */}
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.content}
      >
        {/* Personal Info */}
        <View style={styles.profileInfoContainer}>
          <Image
            style={styles.avatar}
            source={require('@/assets/images/avatar-placeholder.png')}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>SWang123</Text>
            <Text style={styles.email}>swww@example.com</Text>
          </View>
        </View>

        {/* List Items */}
        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => {
            /* TODO:  My orders page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My orders</Text>
              <Text style={styles.infoSubtitle}>Already have x orders</Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => {
            /* TODO: Shipping Addresses page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Shipping Addresses</Text>
              <Text style={styles.infoSubtitle}>
                1234 Main St, Springfield, IA
              </Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => router.push('/payment-method')}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Payment Information</Text>
              <Text style={styles.infoSubtitle}>Visa ending in 1234</Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => {
            /* TODO:  My Reviews page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My Reviews</Text>
              <Text style={styles.infoSubtitle}>Review for x items</Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => {
            /* TODO: Setting page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Setting</Text>
              <Text style={styles.infoSubtitle}>
                Notification, Password, FAQ, Contact
              </Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  headerIcon: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Merriweather', // load this
    fontSize: 18,
    fontWeight: '700',
    color: '#303030',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF0000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  userInfo: {
    marginLeft: 16,
  },
  username: {
    fontFamily: 'NunitoSansBold', 
    fontWeight: '700',
    fontSize: 20,
    fontWeight: '700',
    color: '#232323',
  },
  email: {
    fontSize: 14,
    color: '#808080',
    marginTop: 4,
  },
  infoItem: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  infoTitle: {
    fontFamily: 'NunitoSansBold', 
    fontWeight: '700',
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontFamily: 'NunitoSans', 
    fontWeight: '700',
    fontSize: 14,
    color: '#808080',
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
});

