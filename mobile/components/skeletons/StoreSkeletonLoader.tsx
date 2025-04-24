import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import Skeleton from '../ui/Skeleton';

const StoreSkeletonLoader = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with title and cart */}
      <View style={styles.topBar}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={180} height={20} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      
      {/* Fixed Header with Search */}
      <View style={styles.fixedHeader}>
        <View style={styles.searchContainer}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width="80%" height={20} style={{ marginLeft: 8 }} />
        </View>
      </View>

      {/* Product Grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        <View style={styles.productRow}>
          <View style={styles.productCard}>
            <Skeleton width="100%" height={120} style={styles.productImage} />
            <Skeleton width="80%" height={16} style={styles.productName} />
            <Skeleton width="40%" height={20} style={styles.productPrice} />
            <View style={styles.cartButton}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
          </View>
          
          <View style={styles.productCard}>
            <Skeleton width="100%" height={120} style={styles.productImage} />
            <Skeleton width="80%" height={16} style={styles.productName} />
            <Skeleton width="40%" height={20} style={styles.productPrice} />
            <View style={styles.cartButton}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
          </View>
        </View>

        <View style={styles.productRow}>
          <View style={styles.productCard}>
            <Skeleton width="100%" height={120} style={styles.productImage} />
            <Skeleton width="80%" height={16} style={styles.productName} />
            <Skeleton width="40%" height={20} style={styles.productPrice} />
            <View style={styles.cartButton}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
          </View>
          
          <View style={styles.productCard}>
            <Skeleton width="100%" height={120} style={styles.productImage} />
            <Skeleton width="80%" height={16} style={styles.productName} />
            <Skeleton width="40%" height={20} style={styles.productPrice} />
            <View style={styles.cartButton}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
          </View>
        </View>

        <View style={styles.productRow}>
          <View style={styles.productCard}>
            <Skeleton width="100%" height={120} style={styles.productImage} />
            <Skeleton width="80%" height={16} style={styles.productName} />
            <Skeleton width="40%" height={20} style={styles.productPrice} />
            <View style={styles.cartButton}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
          </View>
          
          <View style={styles.productCard}>
            <Skeleton width="100%" height={120} style={styles.productImage} />
            <Skeleton width="80%" height={16} style={styles.productName} />
            <Skeleton width="40%" height={20} style={styles.productPrice} />
            <View style={styles.cartButton}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === "web" ? 10 : 70,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginTop: 10,
  },
  fixedHeader: {
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingTop: 10,
    zIndex: 10,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    height: 40,
    marginBottom: 10,
  },
  grid: {
    paddingHorizontal: 10,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  productCard: {
    flex: 1,
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    padding: 10,
    position: 'relative',
  },
  productImage: {
    marginBottom: 10,
    borderRadius: 5,
  },
  productName: {
    marginVertical: 5,
  },
  productPrice: {
    marginTop: 5,
  },
  cartButton: {
    position: 'absolute',
    bottom: Platform.OS === "web" ? 10 : -5,
    right: Platform.OS === 'web' ? 340 : 10,
    backgroundColor: '#eee',
    borderRadius: 20,
    padding: 6,
  },
});

export default StoreSkeletonLoader; 