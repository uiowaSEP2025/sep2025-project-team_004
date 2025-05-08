import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Skeleton from '../ui/Skeleton';

const HomeSkeletonLoader = () => {
  return (
    <SafeAreaView style={styles.container}  testID="ActivityIndicator">
      {/* Sensor Selector at top */}
      <View style={styles.sensorSelector}>
        <Skeleton width="85%" height={46} borderRadius={8} style={styles.centered} />
      </View>

      {/* Toggle filter buttons */}
      <View style={styles.toggleContainer}>
        <Skeleton width={90} height={32} borderRadius={20} style={styles.toggleButton} />
        <Skeleton width={110} height={32} borderRadius={20} style={styles.toggleButton} />
        <Skeleton width={130} height={32} borderRadius={20} style={styles.toggleButton} />
      </View>
      
      {/* Chart content area */}
      <View style={styles.scrollContent}>
        <View style={styles.chartContainer}>
          <Skeleton width="100%" height={24} style={styles.chartTitle} />
          <Skeleton width="100%" height={200} borderRadius={8} style={styles.chart} />
        </View>

        <View style={styles.chartContainer}>
          <Skeleton width="100%" height={24} style={styles.chartTitle} />
          <Skeleton width="100%" height={200} borderRadius={8} style={styles.chart} />
        </View>

        <View style={styles.chartContainer}>
          <Skeleton width="100%" height={24} style={styles.chartTitle} />
          <Skeleton width="100%" height={200} borderRadius={8} style={styles.chart} />
        </View>
      </View>

      {/* Map toggle button */}
      <View style={styles.mapToggleButton}>
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sensorSelector: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    marginTop: 20,
  },
  toggleButton: {
    marginHorizontal: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 70,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    marginBottom: 8,
  },
  chart: {
    marginBottom: 16,
  },
  centered: {
    alignSelf: 'center',
  },
  mapToggleButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
  },
});

export default HomeSkeletonLoader; 