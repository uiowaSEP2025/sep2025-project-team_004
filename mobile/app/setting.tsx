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

const SettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <ImageBackground
              source={require('@/assets/images/back-arrow.png')}
              style={styles.backArrow}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Settings
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.optionsContainer}>
          {/* Section: Personal Info */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={[styles.card, styles.cardMarginTopSmall]}>
            <Text style={styles.cardLabel}>Name</Text>
            <Text style={styles.cardValue}>Bruno Pham</Text>
          </View>
          <View style={[styles.card, styles.cardMarginTopLarge]}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue}>bruno203@gmail.com</Text>
          </View>

          {/* Section: Preferences */}
          <Text style={styles.sectionTitleLarge}>Preferences</Text>
          {['Sales', 'New Arrivals', 'Delivery Status'].map((item, index) => (
            <View key={index} style={styles.optionItem}>
              <Text style={styles.optionText}>{item}</Text>
            </View>
          ))}

          {/* Section: Help Center */}
          <Text style={styles.sectionTitleLarge}>Help Center</Text>
          {['FAQ', 'Contact Us', 'Privacy & Terms'].map((label, idx) => (
            <TouchableOpacity key={idx} style={styles.optionItem}>
              <Text style={styles.helpOptionText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    width: 375,
    backgroundColor: '#ffffff',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 20,
    height: 20,
  },
  backArrow: {
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
  headerRightPlaceholder: {
    width: 20,
  },
  optionsContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    color: '#909191',
    marginTop: 20,
    marginLeft: 20,
  },
  sectionTitleLarge: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    color: '#909191',
    marginTop: 30,
    marginLeft: 20,
  },
  card: {
    marginLeft: 20,
    backgroundColor: '#fff',
    width: 335,
    borderRadius: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMarginTopSmall: {
    marginTop: 10,
  },
  cardMarginTopLarge: {
    marginTop: 15,
  },
  cardLabel: {
    color: '#808080',
    fontSize: 12,
  },
  cardValue: {
    color: '#232323',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginTop: 10,
    marginLeft: 20,
    width: 335,
    height: 54,
    borderRadius: 4,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
  },
  helpOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232323',
  },
});
