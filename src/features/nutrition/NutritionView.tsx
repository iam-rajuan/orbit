import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
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
import { WeightGoalCalculatorView } from './components/WeightGoalCalculatorView';
import { SortableList } from '../../components/ui/SortableList';
import { offsetDateKey } from '../../utils/date';
import {
  UtensilsCrossed,
  BarChart3,
  Sliders,
  Copy,
  CheckCircle2,
  Scale,
} from 'lucide-react-native';

export const NutritionView: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { theme, isDark } = useTheme();

  const { selectedDate } = useDateStore();
  const {
    mealSlots,
    loggedEntries,
    goals,
    habits,
    getDayTotals,
    deleteLoggedEntry,
    reorderMealSlots,
    logWater,
    toggleHabit,
    updateHabitNotes,
    copyMealsFromDate,
  } = useNutritionStore();

  const [mainTab, setMainTab] = useState<'log' | 'analytics' | 'calculator'>('log');
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
            backgroundColor: isDark ? 'rgba(12, 12, 16, 0.78)' : 'rgba(255, 255, 255, 0.85)',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            paddingHorizontal: isMobile ? 12 : 24,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                } as any)
              : {}),
          },
        ]}
      >
        <View
          style={[
            styles.viewModeTabs,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderRadius: 9999,
              padding: 3,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMainTab('log')}
            style={[
              styles.modeTab,
              { borderRadius: 9999 },
              mainTab === 'log' && {
                backgroundColor: isDark ? 'rgba(40, 40, 46, 0.9)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
              },
            ]}
          >
            <UtensilsCrossed
              size={14}
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
              { borderRadius: 9999 },
              mainTab === 'analytics' && {
                backgroundColor: isDark ? 'rgba(40, 40, 46, 0.9)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
              },
            ]}
          >
            <BarChart3
              size={14}
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

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMainTab('calculator')}
            style={[
              styles.modeTab,
              { borderRadius: 9999 },
              mainTab === 'calculator' && {
                backgroundColor: isDark ? 'rgba(40, 40, 46, 0.9)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
              },
            ]}
          >
            <Scale
              size={14}
              color={mainTab === 'calculator' ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: mainTab === 'calculator' ? theme.primary : theme.textSecondary },
                mainTab === 'calculator' && styles.modeTabTextActive,
              ]}
            >
              {isMobile ? 'Planner' : 'Weight Planner'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isMobile && (
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
                <Text style={[styles.quickActionText, { color: theme.textSecondary }]}>
                  Copy Yesterday
                </Text>
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
                Routine ({mealSlots.length} Meals)
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
              onPressCalculator={() => setMainTab('calculator')}
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
                <View style={styles.mealSlotsTitleGroup}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    Daily Meals
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.countBadgeText, { color: theme.textMuted }]}>
                      {mealSlots.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.mealSlotsActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCopyYesterday}
                    style={[
                      styles.slotHeaderBtn,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                      },
                    ]}
                    accessibilityLabel="Copy yesterday's meals"
                  >
                    <Copy size={12} color={theme.textSecondary} />
                    <Text style={[styles.slotHeaderBtnText, { color: theme.textSecondary }]}>
                      Copy Yesterday
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsRoutineModalOpen(true)}
                    style={[
                      styles.slotHeaderBtn,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                      },
                    ]}
                    accessibilityLabel="Customize routine"
                  >
                    <Sliders size={12} color={theme.textSecondary} />
                    <Text style={[styles.slotHeaderBtnText, { color: theme.textSecondary }]}>
                      Routine
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <SortableList
                data={mealSlots}
                keyExtractor={(slot) => slot.id}
                onReorder={reorderMealSlots}
                renderItem={({ item: slot, dragHandle }) => {
                  const slotEntries = dayEntries.filter((e) => e.mealSlotId === slot.id);
                  return (
                    <MealSlotCard
                      key={slot.id}
                      slot={slot}
                      entries={slotEntries}
                      dragHandle={dragHandle}
                      onAddFood={(slotId) => setActiveSlotModalId(slotId)}
                      onDeleteEntry={(entryId) => deleteLoggedEntry(entryId)}
                    />
                  );
                }}
              />
            </View>
          </View>
        ) : mainTab === 'analytics' ? (
          /* Analytics Tab */
          <NutritionAnalyticsView />
        ) : (
          /* Weight & Calorie Goal Planner (Lose or Gain) */
          <WeightGoalCalculatorView />
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
    marginBottom: 10,
    marginTop: 4,
  },
  mealSlotsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  mealSlotsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  slotHeaderBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
