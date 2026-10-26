import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { CornerUpRight, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { formatAdaptiveDate } from '../../utils/date';

interface ForwardBadgeProps {
  count: number;
  originalDate?: string;
  size?: 'sm' | 'md';
  showOriginalDate?: boolean;
  style?: ViewStyle;
}

export const ForwardBadge: React.FC<ForwardBadgeProps> = ({
  count,
  originalDate,
  size = 'sm',
  showOriginalDate = false,
  style,
}) => {
  const { isDark } = useTheme();

  if (!count || count <= 0) return null;

  const isUrgent = count >= 3;
  const isModerate = count === 2;

  // Progressive color hierarchy for production-grade visual polish
  let bg = isDark ? 'rgba(99, 102, 241, 0.14)' : '#EEF2FF';
  let border = isDark ? 'rgba(99, 102, 241, 0.28)' : '#C7D2FE';
  let textColor = isDark ? '#A5B4FC' : '#4338CA';
  let iconColor = isDark ? '#818CF8' : '#4F46E5';

  if (isUrgent) {
    // 3x+ Deferral: Subtle Rose attention tint
    bg = isDark ? 'rgba(244, 63, 94, 0.14)' : '#FFF1F2';
    border = isDark ? 'rgba(244, 63, 94, 0.32)' : '#FECDD3';
    textColor = isDark ? '#FB7185' : '#BE123C';
    iconColor = isDark ? '#FB7185' : '#E11D48';
  } else if (isModerate) {
    // 2x Deferral: Subtle Amber warning tint
    bg = isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB';
    border = isDark ? 'rgba(245, 158, 11, 0.32)' : '#FDE68A';
    textColor = isDark ? '#FBBF24' : '#B45309';
    iconColor = isDark ? '#FBBF24' : '#D97706';
  }

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 10.5 : 12.5;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: isSmall ? 2 : 3.5,
          paddingHorizontal: isSmall ? 7 : 9,
        },
        style,
      ]}
      accessibilityLabel={`Deferred ${count} time${count > 1 ? 's' : ''}${
        originalDate ? ` from ${originalDate}` : ''
      }`}
    >
      {isUrgent ? (
        <AlertCircle size={iconSize} color={iconColor} strokeWidth={2.4} />
      ) : (
        <CornerUpRight size={iconSize} color={iconColor} strokeWidth={2.4} />
      )}

      <Text
        style={[
          styles.badgeText,
          {
            color: textColor,
            fontSize: isSmall ? 10 : 11.5,
          },
        ]}
      >
        {count}x
      </Text>

      {showOriginalDate && originalDate && (
        <Text
          style={[
            styles.originalDateText,
            {
              color: textColor,
              opacity: 0.8,
              fontSize: isSmall ? 9 : 10.5,
            },
          ]}
        >
          • from {formatAdaptiveDate(originalDate, 'short')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  originalDateText: {
    fontWeight: '500',
  },
});
