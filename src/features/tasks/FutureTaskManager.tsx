import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDateStore } from '../../stores/useDateStore';
import { Task, TaskHorizon, TaskPriority } from '../../types';
import { FutureTaskFormModal } from './FutureTaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  Edit2,
  CheckCircle2,
  FileText,
  Check,
  FolderOpen,
} from 'lucide-react-native';

export const FutureTaskManager: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();
  const { tasks, toggleTaskComplete, deleteTask, moveToToday } = useTaskStore();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [horizonFilter, setHorizonFilter] = useState<'all' | TaskHorizon | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [effortFilter, setEffortFilter] = useState<'all' | 'quick' | 'deep'>('all');

  // Expanded notes map
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [moveToTodayTask, setMoveToTodayTask] = useState<Task | null>(null);

  // Identify all upcoming / future tasks
  const upcomingTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Is upcoming if explicitly flagged, or horizon is set, or date is in future / someday
      const isExplicitUpcoming = t.isUpcoming === true;
      const hasHorizon = !!t.horizon;
      const isSomeday = t.date === 'someday';
      const isFutureDate = t.date > selectedDate;

      return isExplicitUpcoming || hasHorizon || isSomeday || isFutureDate;
    });
  }, [tasks, selectedDate]);

  // Filtered upcoming tasks
  const filteredTasks = useMemo(() => {
    return upcomingTasks.filter((t) => {
      // Horizon filter
      if (horizonFilter === 'completed') {
        if (!t.completed) return false;
      } else if (horizonFilter === 'all') {
        if (t.completed) return false;
      } else {
        if (t.completed) return false;
        if (t.horizon !== horizonFilter) {
          // If horizon not explicitly set, deduce from date
          if (horizonFilter === 'someday' && t.date !== 'someday') return false;
          if (horizonFilter === 'next_7_days' && (t.date === 'someday' || t.date > selectedDate)) {
            // Check if within 7 days
          }
        }
      }

      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
        return false;
      }

      // Effort filter
      if (effortFilter === 'quick') {
        if (t.estimatedTime !== '15m' && t.estimatedTime !== '30m') return false;
      } else if (effortFilter === 'deep') {
        if (t.estimatedTime !== '1h' && t.estimatedTime !== '2h+') return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesHeading = t.heading?.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesHeading && !matchesNotes && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [upcomingTasks, horizonFilter, priorityFilter, effortFilter, searchQuery, selectedDate]);

  // Metrics
  const stats = useMemo(() => {
    const active = upcomingTasks.filter((t) => !t.completed);
    const completed = upcomingTasks.filter((t) => t.completed);
    const quickWins = active.filter(
      (t) => t.estimatedTime === '15m' || t.estimatedTime === '30m'
    );
    const highImpact = active.filter((t) => t.priority === 'High');
    const somedayCount = active.filter(
      (t) => t.horizon === 'someday' || t.date === 'someday'
    );

    return {
      totalActive: active.length,
      completedCount: completed.length,
      quickWinsCount: quickWins.length,
      highImpactCount: highImpact.length,
      somedayCount: somedayCount.length,
    };
  }, [upcomingTasks]);

  // Group filtered tasks by Heading
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach((t) => {
      const h = t.heading || '📌 General Upcoming Tasks';
      if (!groups[h]) groups[h] = [];
      groups[h].push(t);
    });
    return groups;
  }, [filteredTasks]);

  const toggleExpandNote = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleConfirmMoveToToday = async () => {
    if (!moveToTodayTask) return;
    await moveToToday(moveToTodayTask.id, selectedDate);
    setMoveToTodayTask(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Metrics Row */}
      <View style={styles.metricsRow}>
        {/* Total Ahead */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.metricTop}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Sparkles size={16} color="#8B5CF6" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              UPCOMING PIPELINE
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {stats.totalActive}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textSecondary }]}>
            Planned future tasks ({stats.completedCount} completed)
          </Text>
        </View>

        {/* Quick Wins (Free Time) */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
            },
          ]}
        >
          <View style={styles.metricTop}>
            <View style={[styles.metricIcon, { backgroundColor: '#10B981' }]}>
              <Zap size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.metricLabel, { color: isDark ? '#34D399' : '#047857' }]}>
              QUICK WINS (≤30M)
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: isDark ? '#34D399' : '#059669' }]}>
            {stats.quickWinsCount}
          </Text>
          <Text style={[styles.metricSub, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
            Ready to knock out while you have free time
          </Text>
        </View>

        {/* High Impact Ahead */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? 'rgba(244, 63, 94, 0.12)' : '#FFF1F2',
              borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : '#FECDD3',
            },
          ]}
        >
          <View style={styles.metricTop}>
            <View style={[styles.metricIcon, { backgroundColor: '#F43F5E' }]}>
              <CheckCircle2 size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.metricLabel, { color: isDark ? '#FB7185' : '#BE123C' }]}>
              HIGH IMPACT
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: isDark ? '#FB7185' : '#E11D48' }]}>
            {stats.highImpactCount}
          </Text>
          <Text style={[styles.metricSub, { color: isDark ? '#FECDD3' : '#9F1239' }]}>
            Key strategic deliverables ahead
          </Text>
        </View>
      </View>

      {/* 2. Controls Toolbar: Horizon Tabs & Add Button */}
      <View
        style={[
          styles.toolbarCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.toolbarHeader}>
          {/* Horizon Tabs */}
          <View style={styles.horizonTabs}>
            {[
              { id: 'all', label: `All Ahead (${stats.totalActive})` },
              { id: 'next_7_days', label: '⚡ Next 7 Days' },
              { id: 'this_month', label: '📅 This Month' },
              { id: 'someday', label: `💡 Free Time (${stats.somedayCount})` },
              { id: 'completed', label: `✅ Done (${stats.completedCount})` },
            ].map((tab) => {
              const active = horizonFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.7}
                  onPress={() => setHorizonFilter(tab.id as any)}
                  style={[
                    styles.horizonTab,
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                    !active && {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.horizonTabText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                      active && styles.horizonTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Upcoming Task Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Future Task</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Effort Filters */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <Search size={15} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search upcoming tasks, headings, notes..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Effort Filter Buttons */}
          <View style={styles.effortFilters}>
            {[
              { id: 'all', label: 'All Times' },
              { id: 'quick', label: '⚡ Quick (≤30m)' },
              { id: 'deep', label: '🔨 Deep (1h+)' },
            ].map((ef) => {
              const active = effortFilter === ef.id;
              return (
                <TouchableOpacity
                  key={ef.id}
                  onPress={() => setEffortFilter(ef.id as any)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {ef.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Priority Filter Buttons */}
          <View style={styles.effortFilters}>
            {[
              { id: 'all', label: 'All Priorities' },
              { id: 'High', label: 'High' },
              { id: 'Medium', label: 'Medium' },
              { id: 'Low', label: 'Low' },
            ].map((pf) => {
              const active = priorityFilter === pf.id;
              return (
                <TouchableOpacity
                  key={pf.id}
                  onPress={() => setPriorityFilter(pf.id as any)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {pf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 3. Grouped Tasks List by Heading */}
      {Object.keys(groupedTasks).length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <FolderOpen size={42} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No Upcoming Tasks Found
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try adjusting your search query or filters.'
              : 'Add tasks you need to complete up ahead so you never forget!'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
          >
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.emptyBtnText}>Add Your First Future Task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        Object.entries(groupedTasks).map(([heading, items]) => (
          <View key={heading} style={styles.groupSection}>
            {/* Workstream Section Heading */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  {heading}
                </Text>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
                  ]}
                >
                  <Text style={[styles.countText, { color: theme.textSecondary }]}>
                    {items.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tasks under this Workstream */}
            <View style={styles.tasksList}>
              {items.map((task) => {
                const isExpanded = !!expandedNotes[task.id];
                const priorityColor =
                  task.priority === 'High'
                    ? '#F43F5E'
                    : task.priority === 'Medium'
                    ? '#F59E0B'
                    : '#64748B';

                return (
                  <View
                    key={task.id}
                    style={[
                      styles.taskCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: task.completed
                          ? theme.border
                          : task.priority === 'High'
                          ? isDark
                            ? 'rgba(244, 63, 94, 0.35)'
                            : '#FECDD3'
                          : theme.border,
                      },
                      task.completed && styles.taskCardCompleted,
                    ]}
                  >
                    {/* Top Row: Checkbox, Title, Badges */}
                    <View style={styles.cardHeader}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleTaskComplete(task.id)}
                        style={styles.checkboxTouch}
                      >
                        {task.completed ? (
                          <View style={[styles.checkboxCustom, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        ) : (
                          <View style={[styles.checkboxCustom, { borderColor: theme.textMuted }]} />
                        )}
                      </TouchableOpacity>

                      <View style={styles.cardMain}>
                        <View style={styles.badgesRow}>
                          {/* Priority Badge */}
                          <View
                            style={[
                              styles.priorityBadge,
                              {
                                backgroundColor: isDark
                                  ? `${priorityColor}25`
                                  : `${priorityColor}15`,
                                borderColor: priorityColor,
                              },
                            ]}
                          >
                            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                              {task.priority}
                            </Text>
                          </View>

                          {/* Horizon Badge */}
                          <View
                            style={[
                              styles.horizonBadge,
                              { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
                            ]}
                          >
                            <Calendar size={11} color="#8B5CF6" />
                            <Text style={styles.horizonBadgeText}>
                              {task.horizon === 'someday' || task.date === 'someday'
                                ? 'Free Time Queue'
                                : task.date || 'Next 7 Days'}
                            </Text>
                          </View>

                          {/* Estimated Time Badge */}
                          {task.estimatedTime && (
                            <View
                              style={[
                                styles.timeBadge,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : '#ECFDF5',
                                },
                              ]}
                            >
                              <Clock size={11} color="#10B981" />
                              <Text style={styles.timeBadgeText}>
                                {task.estimatedTime}
                              </Text>
                            </View>
                          )}

                          {/* Category Badge */}
                          <View
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                            ]}
                          >
                            <Text style={[styles.categoryBadgeText, { color: theme.textSecondary }]}>
                              {task.category}
                            </Text>
                          </View>
                        </View>

                        {/* Title */}
                        <Text
                          style={[
                            styles.taskTitle,
                            { color: theme.textPrimary },
                            task.completed && styles.taskTitleCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>

                        {/* Description (one-liner) */}
                        {task.description && (
                          <Text style={[styles.taskDesc, { color: theme.textSecondary }]}>
                            {task.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Detailed Notes (Collapsible) */}
                    {task.notes && (
                      <View style={styles.notesContainer}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleExpandNote(task.id)}
                          style={[
                            styles.notesToggleBar,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <View style={styles.notesToggleLeft}>
                            <FileText size={13} color="#8B5CF6" />
                            <Text style={[styles.notesToggleTitle, { color: theme.textPrimary }]}>
                              Detailed Notes & Instructions
                            </Text>
                          </View>
                          {isExpanded ? (
                            <ChevronUp size={14} color={theme.textMuted} />
                          ) : (
                            <ChevronDown size={14} color={theme.textMuted} />
                          )}
                        </TouchableOpacity>

                        {isExpanded && (
                          <View
                            style={[
                              styles.notesContentBox,
                              {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F1F5F9',
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text style={[styles.notesContentText, { color: theme.textPrimary }]}>
                              {task.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Action Bar */}
                    <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                      {/* Left: 1-Tap "⚡ Move to Today" button */}
                      {!task.completed && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setMoveToTodayTask(task)}
                          style={[
                            styles.doTodayBtn,
                            {
                              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
                            },
                          ]}
                        >
                          <Zap size={13} color="#4F46E5" />
                          <Text style={styles.doTodayBtnText}>⚡ Move to Today</Text>
                        </TouchableOpacity>
                      )}

                      {/* Right: Edit & Delete buttons */}
                      <View style={styles.footerRightActions}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setEditingTask(task);
                            setModalOpen(true);
                          }}
                          style={[styles.iconActionBtn, { borderColor: theme.border }]}
                        >
                          <Edit2 size={13} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setDeleteConfirmId(task.id)}
                          style={[styles.iconActionBtn, { borderColor: theme.border }]}
                        >
                          <Trash2 size={13} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}

      {/* Form Modal */}
      <FutureTaskFormModal
        visible={modalOpen}
        taskToEdit={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Future Task"
        message="Are you sure you want to remove this upcoming task from your plan?"
        confirmText="Delete"
        destructive={true}
        onConfirm={async () => {
          if (deleteConfirmId) {
            await deleteTask(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Move to Today Confirmation */}
      <ConfirmDialog
        visible={!!moveToTodayTask}
        title="Move to Today's Checklist"
        message={`Move "${moveToTodayTask?.title}" to today (${selectedDate})? It will appear immediately on your daily focus task board.`}
        confirmText="Yes, Move to Today"
        cancelText="Cancel"
        destructive={false}
        onConfirm={handleConfirmMoveToToday}
        onCancel={() => setMoveToTodayTask(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 11,
    marginTop: 2,
  },
  toolbarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  toolbarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizonTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  horizonTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  horizonTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  horizonTabTextActive: {
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  effortFilters: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  groupSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tasksList: {
    gap: 10,
  },
  taskCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  taskCardCompleted: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  checkboxCustom: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  horizonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  horizonBadgeText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  taskDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  notesContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  notesToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesToggleTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesContentBox: {
    padding: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  notesContentText: {
    fontSize: 11,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  doTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  doTodayBtnText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 17,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
