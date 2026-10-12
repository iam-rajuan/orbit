import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';

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
  tagColor = '#4F46E5',
  tagBgColor = '#EEF2FF',
  icon,
  iconBgColor = '#F4F4F5',
  metricValue,
  metricLabel,
  ctaText = 'View Details',
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            {icon}
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {tag ? (
                <View style={[styles.tagBadge, { backgroundColor: tagBgColor }]}>
                  <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color="#A1A1AA" />
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.metricVal}>{metricValue}</Text>
          <Text style={styles.metricLbl}>{metricLabel}</Text>
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>{ctaText}</Text>
          <ArrowRight size={14} color="#4F46E5" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 18,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
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
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
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
    color: '#71717A',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FAFAFA',
    paddingTop: 12,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.4,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
