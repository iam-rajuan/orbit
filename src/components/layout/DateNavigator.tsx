import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { formatAdaptiveDate, getTodayKey, offsetDateKey } from '../../utils/date';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../theme/ThemeContext';

interface DateNavigatorProps {
  style?: ViewStyle;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ style }) => {
  const { selectedDate, setSelectedDate, goToPreviousDay, goToNextDay, goToToday } =
    useDateStore();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const [pickerOpen, setPickerOpen] = useState(false);

  const isToday = selectedDate === getTodayKey();
  const isSmallScreen = width < 420;
  const isTabletScreen = width >= 420 && width < 768;
  const dateMode = isSmallScreen ? 'short' : isTabletScreen ? 'medium' : 'full';
  const formattedDate = formatAdaptiveDate(selectedDate, dateMode);

  // Quick picker options
  const quickDates = [
    { label: 'Tue, 06 Oct 2026 (Ref Day 1)', key: '2026-10-06' },
    { label: 'Wed, 07 Oct 2026 (Ref Day 2)', key: '2026-10-07' },
    { label: 'Thu, 08 Oct 2026 (Ref Day 3)', key: '2026-10-08' },
    { label: 'Today', key: getTodayKey() },
    { label: 'Yesterday', key: offsetDateKey(getTodayKey(), -1) },
    { label: 'Tomorrow', key: offsetDateKey(getTodayKey(), 1) },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Day & Date info badge */}
      <View
        style={[
          styles.navGroup,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
            shadowOpacity: theme.shadowOpacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goToPreviousDay}
          style={styles.arrowBtn}
          accessibilityLabel="Previous day"
        >
          <ChevronLeft size={15} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setPickerOpen(true)}
          style={styles.dateSelector}
        >
          <CalendarIcon size={10} color={theme.primary} strokeWidth={2.2} style={styles.calIcon} />
          <View style={styles.dateTextContainer}>
            <Text
              style={[styles.dateTitle, { color: theme.textPrimary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formattedDate}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goToNextDay}
          style={styles.arrowBtn}
          accessibilityLabel="Next day"
        >
          <ChevronRight size={15} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isToday && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goToToday}
          style={[
            styles.todayBtn,
            {
              backgroundColor: theme.primaryBg,
              borderColor: theme.primaryBorder,
            },
          ]}
          accessibilityLabel="Jump to today"
        >
          <Text style={[styles.todayText, { color: theme.primary }]}>Today</Text>
        </TouchableOpacity>
      )}

      {/* Date selector modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableOpacity
          style={[styles.modalBackdrop, { backgroundColor: theme.backdrop }]}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                shadowColor: theme.shadowColor,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <CalendarIcon size={18} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Date</Text>
            </View>
            <View style={styles.dateOptionsList}>
              {quickDates.map((item) => {
                const active = item.key === selectedDate;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedDate(item.key);
                      setPickerOpen(false);
                    }}
                    style={[
                      styles.dateOptionItem,
                      {
                        backgroundColor: active ? theme.primaryBg : theme.surfaceSubtle,
                        borderColor: active ? theme.primaryBorder : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        { color: active ? theme.primary : theme.textPrimary },
                        active && styles.dateOptionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.dateOptionSub, { color: theme.textMuted }]}>{item.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalFooter}>
              <AppButton
                title="Close"
                variant="outline"
                size="sm"
                onPress={() => setPickerOpen(false)}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    flexShrink: 1,
  },
  arrowBtn: {
    width: 28,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: 34,
    flexShrink: 1,
    minWidth: 0,
    cursor: 'pointer' as any,
  },
  calIcon: {
    marginRight: 4,
    opacity: 0.9,
  },
  dateTextContainer: {
    flexDirection: 'column',
    flexShrink: 1,
    minWidth: 0,
  },
  dateTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  todayBtn: {
    height: 28,
    borderWidth: 1,
    paddingHorizontal: 9,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  todayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dateOptionsList: {
    gap: 6,
  },
  dateOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  dateOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateOptionTextActive: {
    fontWeight: '700',
  },
  dateOptionSub: {
    fontSize: 11,
  },
  modalFooter: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
});
