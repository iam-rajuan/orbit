import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface AppProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export const AppProgressBar: React.FC<AppProgressBarProps> = ({
  progress,
  color,
  trackColor,
  height = 6,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const clamped = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));

  const effectiveColor = color || theme.primary;
  const effectiveTrackColor =
    trackColor || (isDark ? 'rgba(255,255,255,0.08)' : '#F4F4F5');

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: effectiveTrackColor,
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
            backgroundColor: effectiveColor,
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
