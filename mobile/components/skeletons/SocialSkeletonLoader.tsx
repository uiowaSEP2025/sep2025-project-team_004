import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Skeleton from '../ui/Skeleton';

const SocialSkeletonLoader = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with profile pic, title and add friend */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={50} height={20} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="90%" height={20} />
        <Skeleton width={18} height={18} borderRadius={9} style={{ marginLeft: 8 }} />
      </View>

      {/* Chat List */}
      <ScrollView style={styles.chatList}>
        {/* Chat Items */}
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.chatItem}>
            <Skeleton width={40} height={40} borderRadius={20} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.chatMeta}>
              <Skeleton width={40} height={12} style={{ alignSelf: 'flex-end' }} />
              {i % 3 === 0 && (
                <Skeleton width={18} height={18} borderRadius={9} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Compose Button */}
      <View style={styles.fab}>
        <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 8 }} />
        <Skeleton width={70} height={18} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fcfcfc' 
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecebeb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    marginHorizontal: 16,
    marginVertical: 10,
    justifyContent: 'space-between',
  },
  chatList: { 
    paddingVertical: 10 
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecebeb',
    backgroundColor: '#ffffff',
  },
  avatar: {
    marginRight: 12,
  },
  chatInfo: { 
    flex: 1 
  },
  chatMeta: {
    alignItems: 'flex-end',
    width: 50,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default SocialSkeletonLoader; 