import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { NutritionDeficiencyAlert } from '../../../types/nutrition';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Droplet,
  Scale,
} from 'lucide-react-native';

interface DeficiencyAlertCardProps {
  alerts: NutritionDeficiencyAlert[];
}

export const DeficiencyAlertCard: React.FC<DeficiencyAlertCardProps> = ({ alerts }) => {
  const { theme, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  // Determine primary alert to show prominently
  const primaryAlert =
    alerts.find((a) => a.severity === 'warning') ||
    alerts.find((a) => a.severity === 'info') ||
    alerts[0];

  const getAlertColors = (severity: 'warning' | 'info' | 'success') => {
    switch (severity) {
      case 'warning':
        return {
          bg: isDark ? 'rgba(244, 63, 94, 0.12)' : '#FFF1F2',
          border: isDark ? 'rgba(244, 63, 94, 0.3)' : '#FECDD3',
          text: isDark ? '#FDA4AF' : '#BE123C',
          iconColor: '#F43F5E',
        };
      case 'info':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
          text: isDark ? '#FCD34D' : '#B45309',
          iconColor: '#F59E0B',
        };
      case 'success':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
          text: isDark ? '#6EE7B7' : '#047857',
          iconColor: '#10B981',
        };
    }
  };

  const colors = getAlertColors(primaryAlert.severity);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
        style={styles.headerRow}
      >
        <View style={styles.titleGroup}>
          {primaryAlert.severity === 'warning' ? (
            <AlertTriangle size={18} color={colors.iconColor} />
          ) : primaryAlert.severity === 'info' ? (
            <Info size={18} color={colors.iconColor} />
          ) : (
            <CheckCircle2 size={18} color={colors.iconColor} />
          )}

          <View style={styles.headerTexts}>
            <Text style={[styles.title, { color: colors.text }]}>{primaryAlert.title}</Text>
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
              ]}
              numberOfLines={expanded ? undefined : 1}
            >
              {primaryAlert.message}
            </Text>
          </View>
        </View>

        {alerts.length > 1 && (
          <View style={styles.expandToggle}>
            <Text style={[styles.badgeCount, { color: colors.text }]}>
              {alerts.length} insights
            </Text>
            {expanded ? (
              <ChevronUp size={16} color={colors.text} />
            ) : (
              <ChevronDown size={16} color={colors.text} />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded list of all deficiency / diagnostic insights */}
      {expanded && alerts.length > 1 && (
        <View style={[styles.expandedList, { borderTopColor: colors.border }]}>
          {alerts.map((alert, index) => {
            const itemColors = getAlertColors(alert.severity);
            return (
              <View
                key={index}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                    borderColor: itemColors.border,
                  },
                ]}
              >
                <View style={styles.alertItemHeader}>
                  {alert.type === 'protein' ? (
                    <Dumbbell size={15} color={itemColors.iconColor} />
                  ) : alert.type === 'hydration' ? (
                    <Droplet size={15} color={itemColors.iconColor} />
                  ) : (
                    <Scale size={15} color={itemColors.iconColor} />
                  )}
                  <Text style={[styles.alertItemTitle, { color: itemColors.text }]}>
                    {alert.title}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.alertItemMessage,
                    { color: isDark ? '#D4D4D8' : theme.textSecondary },
                  ]}
                >
                  {alert.message}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    cursor: 'pointer' as any,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  expandedList: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  alertItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  alertItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertItemTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertItemMessage: {
    fontSize: 11,
    lineHeight: 16,
    paddingLeft: 21,
  },
});
