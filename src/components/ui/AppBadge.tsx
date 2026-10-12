import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { PRIORITY_COLORS, CATEGORY_COLORS, EXPENSE_TYPE_COLORS } from '../../theme/colors';

interface AppBadgeProps {
  label: string;
  variant?: 'priority' | 'category' | 'expenseType' | 'default';
  priority?: 'High' | 'Medium' | 'Low';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'default',
  priority,
  size = 'md',
  style,
  textStyle,
}) => {
  let bg = '#F4F4F5';
  let textColor = '#52525B';
  let border = 'transparent';

  if (variant === 'priority' && priority) {
    const pStyle = PRIORITY_COLORS[priority];
    if (pStyle) {
      bg = pStyle.bg;
      textColor = pStyle.text;
      border = 'transparent';
    }
  } else if (variant === 'expenseType') {
    const eStyle = EXPENSE_TYPE_COLORS[label as 'Need' | 'Want'];
    if (eStyle) {
      bg = eStyle.bg;
      textColor = eStyle.text;
      border = 'transparent';
    }
  } else if (variant === 'category') {
    const cStyle = CATEGORY_COLORS[label];
    if (cStyle) {
      bg = cStyle.bg;
      textColor = cStyle.text;
      border = 'transparent';
    }
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
          borderRadius: 100,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 0,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
