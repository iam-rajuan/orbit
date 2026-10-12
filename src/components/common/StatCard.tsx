import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

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
  iconBgColor = '#eef2ff',
  progressPercentage,
  progressColor = '#4f46e5',
  onPress,
  style,
}) => {
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
            {icon}
          </View>
        )}
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {progressPercentage !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                  backgroundColor: progressColor,
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 18,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
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
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#18181B',
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
    color: '#71717A',
    marginTop: 6,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
});
