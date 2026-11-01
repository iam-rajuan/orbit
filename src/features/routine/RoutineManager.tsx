import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Clock,
  Plus,
  CheckCircle2,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppProgressBar } from '../../components/ui/AppProgressBar';
import { SortableList } from '../../components/ui/SortableList';
import { SwipeableRoutineCard } from './SwipeableRoutineCard';
import { RoutineFormModal } from './RoutineFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RoutineItem } from '../../types';
import { isRoutineScheduledForDate, formatAdaptiveDate } from '../../utils/date';

export const RoutineManager: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();
  const {
    routines,
    completions,
    toggleCompletion,
    deleteRoutine,
    reorderRoutines,
    getRoutineProgress,
  } = useRoutineStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeSwipedRoutineId, setActiveSwipedRoutineId] = useState<string | null>(null);

  const progress = getRoutineProgress(selectedDate);


  const dayScheduledRoutines = routines.filter((r) =>
    isRoutineScheduledForDate(r.repeatDays, selectedDate)
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? 'rgba(24, 24, 28, 0.76)' : 'rgba(255, 255, 255, 0.88)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: theme.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 14,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(24px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                } as any)
              : {}),
          },
        ]}
      >
        {/* Top Header Row: Icon + Title/Subtitle on Left | + Habit Button on Right */}
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5' },
              ]}
            >
              <Clock size={19} color="#10B981" strokeWidth={2.4} />
            </View>
            <View style={styles.titleTextCol}>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Daily Routine
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {formatAdaptiveDate(selectedDate, 'medium')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingRoutine(null);
              setModalOpen(true);
            }}
            style={[styles.addHabitBtn, { backgroundColor: theme.primary }]}
            accessibilityLabel="Add new routine habit"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.addHabitBtnText}>Habit</Text>
          </TouchableOpacity>
        </View>

        {/* Progress & Stats Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <View style={styles.progressNumbersRow}>
              <Text style={[styles.progressCountCurrent, { color: theme.textPrimary }]}>
                {progress.completed}
              </Text>
              <Text style={[styles.progressCountTotal, { color: theme.textSecondary }]}>
                /{progress.total}
              </Text>
              <Text style={[styles.progressCountLabel, { color: theme.textMuted }]}>
                completed
              </Text>
            </View>

            {progress.completed === progress.total && progress.total > 0 ? (
              <View
                style={[
                  styles.completeBadge,
                  { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5' },
                ]}
              >
                <CheckCircle2 size={13} color="#10B981" strokeWidth={2.4} />
                <Text style={[styles.completeBadgeText, { color: isDark ? '#34D399' : '#059669' }]}>
                  100% Done
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.percentBadge,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
                ]}
              >
                <Text style={[styles.percentBadgeText, { color: isDark ? '#34D399' : '#059669' }]}>
                  {progress.percentage}%
                </Text>
              </View>
            )}
          </View>

          <AppProgressBar
            progress={progress.percentage}
            color="#10B981"
            height={6}
          />
        </View>
      </View>

      {/* Routine Timeline list */}
      <View style={styles.timelineList}>
        <SortableList
          data={dayScheduledRoutines}
          keyExtractor={(r) => r.id}
          onReorder={reorderRoutines}
          onItemPress={(routine) => {
            setEditingRoutine(routine);
            setModalOpen(true);
          }}
          renderItem={({ item: routine }) => {
            const comp = completions.find(
              (c) => c.date === selectedDate && c.routineId === routine.id
            );
            const isDone = !!comp?.completed;

            return (
              <SwipeableRoutineCard
                key={routine.id}
                isCurrentOpen={activeSwipedRoutineId === routine.id}
                onOpen={() => setActiveSwipedRoutineId(routine.id)}
                onClose={() => {
                  if (activeSwipedRoutineId === routine.id) {
                    setActiveSwipedRoutineId(null);
                  }
                }}
                onSwipeStart={() => {
                  if (activeSwipedRoutineId !== routine.id) {
                    setActiveSwipedRoutineId(routine.id);
                  }
                }}
                onEdit={() => {
                  setEditingRoutine(routine);
                  setModalOpen(true);
                }}
                onDelete={() => setDeleteConfirmId(routine.id)}
              >
                <View
                  style={[
                    styles.routineCard,
                    {
                      backgroundColor: isDone
                        ? isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(255,255,255,0.5)'
                        : isDark
                        ? 'rgba(24, 24, 28, 0.76)'
                        : 'rgba(255, 255, 255, 0.85)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: isDark ? 0.25 : 0.04,
                      shadowRadius: 10,
                      ...(Platform.OS === 'web'
                        ? ({
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                          } as any)
                        : {}),
                    },
                    isDone && styles.routineCardCompleted,
                  ]}
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.timeTag,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          { color: theme.textSecondary },
                          isDone && styles.timeTextDone,
                        ]}
                      >
                        {routine.time}
                      </Text>
                    </View>

                    <View style={styles.cardDetails}>
                      <Text
                        style={[
                          styles.routineTitle,
                          { color: theme.textPrimary },
                          isDone && styles.routineTitleDone,
                        ]}
                      >
                        {routine.title}
                      </Text>
                      {routine.description ? (
                        <Text style={[styles.routineDesc, { color: theme.textMuted }]}>
                          {routine.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cardRight} {...({ 'data-interactive': 'true' } as any)}>
                    <AppCheckbox
                      checked={isDone}
                      onToggle={() => toggleCompletion(selectedDate, routine.id)}
                      size={22}
                    />
                  </View>
                </View>
              </SwipeableRoutineCard>
            );
          }}
        />
      </View>

      {/* Routine Form Modal */}
      <RoutineFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRoutine(null);
        }}
        routineToEdit={editingRoutine}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Routine Habit"
        message="Are you sure you want to remove this habit? Historical records for completed days will be preserved."
        onConfirm={async () => {
          if (deleteConfirmId) {
            await deleteRoutine(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  titleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addHabitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  addHabitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  progressCountCurrent: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  progressCountTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressCountLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 3,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  percentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineList: {
    gap: 10,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    ...(Platform.OS === 'web'
      ? ({
          transition: 'background-color 0.22s ease, border-color 0.22s ease, opacity 0.22s ease',
        } as any)
      : {}),
  },
  routineCardCompleted: {
    opacity: 0.75,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  timeTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    minWidth: 76,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeTextDone: {
    color: '#059669',
  },
  cardDetails: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  routineTitleDone: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  routineDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
});
