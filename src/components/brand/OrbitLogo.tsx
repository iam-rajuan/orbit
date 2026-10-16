import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface OrbitLogoProps {
  size?: number; // Base font size for the wordmark in px
  showTagline?: boolean;
  collapsed?: boolean;
  variant?: 'auto' | 'light' | 'dark';
  style?: ViewStyle;
}

export const OrbitLogo: React.FC<OrbitLogoProps> = ({
  size = 20,
  showTagline = false,
  collapsed = false,
  variant = 'auto',
  style,
}) => {
  const { isDark: appIsDark } = useTheme();

  const isDark =
    variant === 'dark' ? true : variant === 'light' ? false : appIsDark;

  const textColor = isDark ? '#FAFAFA' : '#09090B';
  const dotColor = isDark ? '#38BDF8' : '#4F46E5';
  const taglineColor = isDark ? '#71717A' : '#71717A';

  // Responsive typography metrics
  const fontSize = size;
  const letterSpacing = Math.round(size * 0.18);
  const dotSize = Math.max(4, Math.round(size * 0.22));

  if (collapsed) {
    return (
      <View style={[styles.container, styles.collapsedContainer, style]}>
        <View style={styles.monogramRow}>
          <Text
            style={[
              styles.monogramText,
              {
                color: textColor,
                fontSize: size * 1.25,
              },
            ]}
          >
            O
          </Text>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: dotColor,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                marginLeft: 1,
                marginBottom: size * 0.15,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.wordmarkRow}>
        <Text
          style={[
            styles.wordmark,
            {
              color: textColor,
              fontSize,
              letterSpacing,
            },
          ]}
        >
          ORBIT
        </Text>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: dotColor,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              marginBottom: size * 0.12,
            },
          ]}
        />
      </View>

      {showTagline && (
        <Text
          style={[
            styles.tagline,
            {
              color: taglineColor,
              fontSize: Math.max(9, Math.round(size * 0.45)),
              letterSpacing: Math.round(size * 0.12),
            },
          ]}
        >
          LIFE IN SYNC
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  collapsedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  monogramRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '900',
    fontFamily: 'System',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  monogramText: {
    fontWeight: '900',
    fontFamily: 'System',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  dot: {
    alignSelf: 'flex-end',
  },
  tagline: {
    fontWeight: '700',
    fontFamily: 'System',
    textTransform: 'uppercase',
    marginTop: 2,
    includeFontPadding: false,
  },
});
