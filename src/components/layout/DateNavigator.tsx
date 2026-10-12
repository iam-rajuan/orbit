import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Modal,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { formatDisplayDate, getWeekdayName, getTodayKey, offsetDateKey } from '../../utils/date';
import { AppButton } from '../ui/AppButton';

interface DateNavigatorProps {
  style?: ViewStyle;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ style }) => {
  const { selectedDate, setSelectedDate, goToPreviousDay, goToNextDay, goToToday } =
    useDateStore();

  const [pickerOpen, setPickerOpen] = useState(false);

  const isToday = selectedDate === getTodayKey();
  const formattedDate = formatDisplayDate(selectedDate);

  // Quick picker options (previous 3 days, today, next 3 days, and spreadsheet test days)
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
      <View style={styles.navGroup}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goToPreviousDay}
          style={styles.arrowBtn}
          accessibilityLabel="Previous day"
        >
          <ChevronLeft size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setPickerOpen(true)}
          style={styles.dateSelector}
        >
          <CalendarIcon size={16} color="#4F46E5" style={styles.calIcon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateTitle}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goToNextDay}
          style={styles.arrowBtn}
          accessibilityLabel="Next day"
        >
          <ChevronRight size={18} color="#52525B" />
        </TouchableOpacity>
      </View>

      {!isToday && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goToToday}
          style={styles.todayBtn}
        >
          <Text style={styles.todayText}>Today</Text>
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
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <CalendarIcon size={18} color="#4F46E5" />
              <Text style={styles.modalTitle}>Select Date</Text>
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
                    style={[styles.dateOptionItem, active && styles.dateOptionActive]}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        active && styles.dateOptionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.dateOptionSub}>{item.key}</Text>
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
    gap: 8,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F4F4F5',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 3,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    cursor: 'pointer' as any,
  },
  calIcon: {
    marginRight: 8,
  },
  dateTextContainer: {
    flexDirection: 'column',
  },
  dateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  todayBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
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
    borderBottomColor: '#F4F4F5',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
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
    borderColor: '#F4F4F5',
    backgroundColor: '#FAFAFA',
    cursor: 'pointer' as any,
  },
  dateOptionActive: {
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  dateOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  dateOptionTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  dateOptionSub: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  modalFooter: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
});
