import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  progressPercentage?: number;
  progressColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  progressPercentage,
  progressColor,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  const finalIconBgColor = iconBgColor || theme.primaryBg;
  const finalProgressColor = progressColor || theme.primary;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadowColor,
          shadowOpacity: theme.shadowOpacity,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
        </View>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: finalIconBgColor }]}>
            {icon}
          </View>
        )}
      </View>

      {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}

      {progressPercentage !== undefined && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.surfaceSubtle }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                  backgroundColor: finalProgressColor,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: 200,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
});
