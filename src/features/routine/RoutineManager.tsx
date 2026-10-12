import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppButton } from '../../components/ui/AppButton';
import { AppProgressBar } from '../../components/ui/AppProgressBar';
import { RoutineFormModal } from './RoutineFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RoutineItem } from '../../types';
import { isRoutineScheduledForDate, getTodayKey } from '../../utils/date';

export const RoutineManager: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { selectedDate } = useDateStore();
  const {
    routines,
    completions,
    toggleCompletion,
    deleteRoutine,
    getRoutineProgress,
  } = useRoutineStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const progress = getRoutineProgress(selectedDate);
  const isToday = selectedDate === getTodayKey();

  const dayScheduledRoutines = routines.filter((r) =>
    isRoutineScheduledForDate(r.repeatDays, selectedDate)
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View style={styles.iconCircle}>
              <Clock size={20} color="#059669" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Daily Habits & Routine</Text>
              <Text style={styles.pageSubtitle}>
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
            <Text style={styles.progressPercentText}>
              Routine Progress: {progress.completed} / {progress.total} ({progress.percentage}%)
            </Text>
            {progress.completed === progress.total && progress.total > 0 && (
              <View style={styles.completeBadge}>
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.completeBadgeText}>All Completed</Text>
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
        {dayScheduledRoutines.map((routine, index) => {
          const comp = completions.find(
            (c) => c.date === selectedDate && c.routineId === routine.id
          );
          const isDone = !!comp?.completed;

          return (
            <View
              key={routine.id}
              style={[
                styles.routineCard,
                isDone && styles.routineCardCompleted,
              ]}
            >
              <View style={styles.cardLeft}>
                <View style={styles.timeTag}>
                  <Text style={[styles.timeText, isDone && styles.timeTextDone]}>
                    {routine.time}
                  </Text>
                </View>

                <View style={styles.cardDetails}>
                  <Text
                    style={[
                      styles.routineTitle,
                      isDone && styles.routineTitleDone,
                    ]}
                  >
                    {routine.title}
                  </Text>
                  {routine.description ? (
                    <Text style={styles.routineDesc}>{routine.description}</Text>
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
                  style={styles.iconBtn}
                >
                  <Edit2 size={16} color="#71717A" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setDeleteConfirmId(routine.id)}
                  style={styles.iconBtn}
                >
                  <Trash2 size={16} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 20,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
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
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
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
    color: '#059669',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  timelineList: {
    gap: 10,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 16,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  routineCardCompleted: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F4F4F5',
    opacity: 0.8,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  timeTag: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525B',
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
    color: '#18181B',
    letterSpacing: -0.2,
  },
  routineTitleDone: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  routineDesc: {
    fontSize: 12,
    color: '#71717A',
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
    backgroundColor: '#F4F4F5',
    cursor: 'pointer' as any,
  },
});
