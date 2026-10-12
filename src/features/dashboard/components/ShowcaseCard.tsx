import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ShowcaseCardProps {
  title: string;
  subtitle: string;
  tag?: string;
  tagColor?: string;
  tagBgColor?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  metricValue: string;
  metricLabel: string;
  ctaText?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({
  title,
  subtitle,
  tag,
  tagColor,
  tagBgColor,
  icon,
  iconBgColor,
  metricValue,
  metricLabel,
  ctaText = 'View Details',
  onPress,
  style,
}) => {
  const { theme, isDark } = useTheme();

  const effectiveTagColor = tagColor || theme.primary;
  const effectiveTagBgColor = tagBgColor || (isDark ? 'rgba(99,102,241,0.18)' : '#EEF2FF');
  const effectiveIconBgColor = iconBgColor || (isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5');

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: effectiveIconBgColor }]}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
              {tag ? (
                <View style={[styles.tagBadge, { backgroundColor: effectiveTagBgColor }]}>
                  <Text style={[styles.tagText, { color: effectiveTagColor }]}>{tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={theme.textMuted} />
      </View>

      <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
        <View>
          <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{metricValue}</Text>
          <Text style={[styles.metricLbl, { color: theme.textMuted }]}>{metricLabel}</Text>
        </View>

        <View
          style={[
            styles.ctaRow,
            {
              backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: theme.primary }]}>{ctaText}</Text>
          <ArrowRight size={14} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
