import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface AppProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export const AppProgressBar: React.FC<AppProgressBarProps> = ({
  progress,
  color = '#10B981',
  trackColor = '#F4F4F5',
  height = 6,
  style,
}) => {
  const clamped = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: trackColor,
          height,
          borderRadius: height,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color,
            borderRadius: height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
