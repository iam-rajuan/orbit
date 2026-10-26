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
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppButton } from '../../components/ui/AppButton';
import { AppProgressBar } from '../../components/ui/AppProgressBar';
import { SortableList } from '../../components/ui/SortableList';
import { RoutineFormModal } from './RoutineFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RoutineItem } from '../../types';
import { isRoutineScheduledForDate } from '../../utils/date';

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
            backgroundColor: isDark ? 'rgba(24, 24, 28, 0.72)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.25 : 0.04,
            shadowRadius: 12,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(24px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                } as any)
              : {}),
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' },
              ]}
            >
              <Clock size={20} color="#059669" />
            </View>
            <View>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Daily Habits & Routine</Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                Fixed recurring habits for {selectedDate}
              </Text>
            </View>
          </View>
          <AppButton
            title="Add Habit"
            variant="primary"
            size="sm"
            icon={<Plus size={16} color="#ffffff" />}
            onPress={() => {
              setEditingRoutine(null);
              setModalOpen(true);
            }}
          />
        </View>

        {/* Progress Bar & Stats */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressPercentText, { color: isDark ? '#34D399' : '#059669' }]}>
              Routine Progress: {progress.completed} / {progress.total} ({progress.percentage}%)
            </Text>
            {progress.completed === progress.total && progress.total > 0 && (
              <View
                style={[
                  styles.completeBadge,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' },
                ]}
              >
                <CheckCircle2 size={14} color="#059669" />
                <Text style={[styles.completeBadgeText, { color: isDark ? '#34D399' : '#059669' }]}>
                  All Completed
                </Text>
              </View>
            )}
          </View>
          <AppProgressBar
            progress={progress.percentage}
            color="#10b981"
            height={10}
          />
        </View>
      </View>

      {/* Routine Timeline list */}
      <View style={styles.timelineList}>
        <SortableList
          data={dayScheduledRoutines}
          keyExtractor={(r) => r.id}
          onReorder={reorderRoutines}
          renderItem={({ item: routine }) => {
            const comp = completions.find(
              (c) => c.date === selectedDate && c.routineId === routine.id
            );
            const isDone = !!comp?.completed;

            return (
              <View
                key={routine.id}
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

                <View style={styles.cardRight}>
                  <AppCheckbox
                    checked={isDone}
                    onToggle={() => toggleCompletion(selectedDate, routine.id)}
                    size={22}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setEditingRoutine(routine);
                      setModalOpen(true);
                    }}
                    style={[
                      styles.iconBtn,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5' },
                    ]}
                  >
                    <Edit2 size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDeleteConfirmId(routine.id)}
                    style={[
                      styles.iconBtn,
                      { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' },
                    ]}
                  >
                    <Trash2 size={16} color="#F43F5E" />
                  </TouchableOpacity>
                </View>
              </View>
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
    padding: 20,
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
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  progressSection: {
    gap: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  completeBadgeText: {
    fontSize: 11,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
});
