import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useDateStore } from '../../stores/useDateStore';
import { useNutritionStore } from '../../stores/useNutritionStore';
import { MacroRingCard } from './components/MacroRingCard';
import { DeficiencyAlertCard } from './components/DeficiencyAlertCard';
import { WaterHabitCard } from './components/WaterHabitCard';
import { MealSlotCard } from './components/MealSlotCard';
import { FoodLogModal } from './components/FoodLogModal';
import { MealRoutineModal } from './components/MealRoutineModal';
import { NutritionGoalsModal } from './components/NutritionGoalsModal';
import { NutritionAnalyticsView } from './components/NutritionAnalyticsView';
import { offsetDateKey } from '../../utils/date';
import {
  UtensilsCrossed,
  BarChart3,
  Sliders,
  Copy,
  CheckCircle2,
} from 'lucide-react-native';

export const NutritionView: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { theme } = useTheme();

  const { selectedDate } = useDateStore();
  const {
    mealSlots,
    loggedEntries,
    goals,
    habits,
    getDayTotals,
    deleteLoggedEntry,
    logWater,
    toggleHabit,
    updateHabitNotes,
    copyMealsFromDate,
  } = useNutritionStore();

  const [mainTab, setMainTab] = useState<'log' | 'analytics' | 'routine'>('log');
  const [activeSlotModalId, setActiveSlotModalId] = useState<string | null>(null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Compute summary for selected day
  const daySummary = useMemo(() => {
    return getDayTotals(selectedDate);
  }, [selectedDate, getDayTotals]);

  // Filter entries for selected day
  const dayEntries = useMemo(() => {
    return loggedEntries.filter((e) => e.date === selectedDate);
  }, [loggedEntries, selectedDate]);

  // Current day's habit log
  const dayHabit = habits[selectedDate];

  const handleCopyYesterday = async () => {
    const yesterday = offsetDateKey(selectedDate, -1);
    await copyMealsFromDate(yesterday, selectedDate);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      {/* Subheader Navigation Bar */}
      <View
        style={[
          styles.subHeader,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            paddingHorizontal: isMobile ? 14 : 24,
          },
        ]}
      >
        <View style={styles.viewModeTabs}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMainTab('log')}
            style={[
              styles.modeTab,
              mainTab === 'log' && {
                backgroundColor: theme.primaryBg,
                borderColor: theme.primaryBorder,
              },
            ]}
          >
            <UtensilsCrossed
              size={15}
              color={mainTab === 'log' ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: mainTab === 'log' ? theme.primary : theme.textSecondary },
                mainTab === 'log' && styles.modeTabTextActive,
              ]}
            >
              Meal Log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMainTab('analytics')}
            style={[
              styles.modeTab,
              mainTab === 'analytics' && {
                backgroundColor: theme.primaryBg,
                borderColor: theme.primaryBorder,
              },
            ]}
          >
            <BarChart3
              size={15}
              color={mainTab === 'analytics' ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: mainTab === 'analytics' ? theme.primary : theme.textSecondary },
                mainTab === 'analytics' && styles.modeTabTextActive,
              ]}
            >
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick action buttons on subheader */}
        <View style={styles.quickActions}>
          {mainTab === 'log' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopyYesterday}
              style={[
                styles.quickActionBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
              accessibilityLabel="Copy yesterday's meals"
            >
              <Copy size={13} color={theme.textSecondary} />
              {!isMobile && (
                <Text style={[styles.quickActionText, { color: theme.textSecondary }]}>
                  Copy Yesterday
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsRoutineModalOpen(true)}
            style={[
              styles.quickActionBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
            accessibilityLabel="Configure meal routine"
          >
            <Sliders size={13} color={theme.textSecondary} />
            <Text style={[styles.quickActionText, { color: theme.textSecondary }]}>
              {isMobile ? `${mealSlots.length} Meals` : `Routine (${mealSlots.length} Meals)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copied Success Toast */}
      {copiedNotice && (
        <View style={[styles.toastNotice, { backgroundColor: '#10B981' }]}>
          <CheckCircle2 size={14} color="#ffffff" />
          <Text style={styles.toastNoticeText}>Copied yesterday&apos;s meal entries to today!</Text>
        </View>
      )}

      {/* Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isMobile ? 12 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {mainTab === 'log' ? (
          <View style={styles.logContainer}>
            {/* 1. Hero Calorie Ring & Macro Progress Meter */}
            <MacroRingCard
              summary={daySummary}
              onPressEditGoals={() => setIsGoalsModalOpen(true)}
            />

            {/* 2. Deficiency Diagnostics & Feedback */}
            <DeficiencyAlertCard alerts={daySummary.deficiencies} />

            {/* 3. Hydration & Daily Food Habits */}
            <WaterHabitCard
              waterIntakeMl={daySummary.waterIntakeMl}
              waterTargetMl={goals.waterTargetMl}
              habit={dayHabit}
              onLogWater={(delta) => logWater(selectedDate, delta)}
              onToggleHabit={(key) => toggleHabit(selectedDate, key)}
              onSaveNotes={(notes) => updateHabitNotes(selectedDate, notes)}
            />

            {/* 4. Meal Routine Slot Cards (Breakfast, Lunch, Habit Snack, Dinner, etc.) */}
            <View style={styles.mealSlotsSection}>
              <View style={styles.mealSlotsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Daily Meal Plan ({mealSlots.length} meals)
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsRoutineModalOpen(true)}
                  style={styles.editRoutineLink}
                >
                  <Text style={[styles.editRoutineLinkText, { color: theme.primary }]}>
                    Customize Routine
                  </Text>
                </TouchableOpacity>
              </View>

              {mealSlots.map((slot) => {
                const slotEntries = dayEntries.filter((e) => e.mealSlotId === slot.id);
                return (
                  <MealSlotCard
                    key={slot.id}
                    slot={slot}
                    entries={slotEntries}
                    onAddFood={(slotId) => setActiveSlotModalId(slotId)}
                    onDeleteEntry={(entryId) => deleteLoggedEntry(entryId)}
                  />
                );
              })}
            </View>
          </View>
        ) : (
          /* Analytics Tab */
          <NutritionAnalyticsView />
        )}
      </ScrollView>

      {/* Food Log Modal */}
      <FoodLogModal
        visible={!!activeSlotModalId}
        mealSlotId={activeSlotModalId}
        date={selectedDate}
        onClose={() => setActiveSlotModalId(null)}
      />

      {/* Routine Configuration Modal */}
      <MealRoutineModal
        visible={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
      />

      {/* Goals & Macro Targets Modal */}
      <NutritionGoalsModal
        visible={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  viewModeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    cursor: 'pointer' as any,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modeTabTextActive: {
    fontWeight: '800',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toastNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  toastNoticeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  logContainer: {
    flexDirection: 'column',
  },
  mealSlotsSection: {
    marginTop: 4,
  },
  mealSlotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  editRoutineLink: {
    paddingVertical: 2,
    cursor: 'pointer' as any,
  },
  editRoutineLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
