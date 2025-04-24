import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle,
  cancelAnimation
} from 'react-native-reanimated';
import { DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animate = true,
}) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (animate) {
      opacity.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
      );
    }
    
    return () => {
      cancelAnimation(opacity);
    };
  }, [animate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        animatedStyle,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
});

export default Skeleton; 