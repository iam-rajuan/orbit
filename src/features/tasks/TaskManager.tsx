import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  CornerUpRight,
  RotateCcw,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDateStore } from '../../stores/useDateStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { TaskFormModal } from './TaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Task, TaskPriority } from '../../types';
import { generateId } from '../../utils/id';
import { FutureTaskManager } from './FutureTaskManager';
import { ForwardBadge } from './ForwardBadge';
import { offsetDateKey, formatAdaptiveDate } from '../../utils/date';

export const TaskManager: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const params = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | null>(null);
  const activeView = selectedTab ?? (params.tab === 'upcoming' ? 'upcoming' : 'today');

  const { theme, isDark } = useTheme();
  const { selectedDate, setSelectedDate } = useDateStore();
  const {
    searchQuery,
    filterCategory,
    filterStatus,
    selectedTaskIds,
    setSearchQuery,
    setFilterCategory,
    setFilterStatus,
    toggleSelectTask,
    selectAllTasks,
    clearSelection,
    toggleTaskComplete,
    createTask,
    deleteTask,
    bulkComplete,
    bulkDelete,
    getFilteredTasks,
    getTaskProgress,
    forwardTaskToTomorrow,
    bulkForwardToTomorrow,
    undoForwardTask,
  } = useTaskStore();

  const { settings } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [forwardToast, setForwardToast] = useState<{
    taskTitle: string;
    taskId: string;
    previousDate: string;
    previousCount?: number;
    previousOriginalDate?: string;
    newDate: string;
    count: number;
    isBulk?: boolean;
    bulkCount?: number;
  } | null>(null);

  const handleForwardSingle = async (task: Task) => {
    const updated = await forwardTaskToTomorrow(task.id);
    if (updated) {
      setForwardToast({
        taskTitle: task.title,
        taskId: task.id,
        previousDate: task.date,
        previousCount: task.forwardCount,
        previousOriginalDate: task.originalDate,
        newDate: updated.date,
        count: updated.forwardCount || 1,
      });
    }
  };

  const handleBulkForward = async () => {
    const count = await bulkForwardToTomorrow(selectedTaskIds);
    if (count > 0) {
      setForwardToast({
        taskTitle: `${count} tasks`,
        taskId: '',
        previousDate: selectedDate,
        newDate: offsetDateKey(selectedDate, 1),
        count: 1,
        isBulk: true,
        bulkCount: count,
      });
    }
  };

  const handleUndoForward = async () => {
    if (!forwardToast || forwardToast.isBulk) {
      setForwardToast(null);
      return;
    }
    await undoForwardTask(
      forwardToast.taskId,
      forwardToast.previousDate,
      forwardToast.previousCount,
      forwardToast.previousOriginalDate
    );
    setForwardToast(null);
  };

  useEffect(() => {
    if (forwardToast) {
      const timer = setTimeout(() => {
        setForwardToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [forwardToast]);

  // Quick Composer State for Today
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<string>(settings.taskCategories[0] || 'Office');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');

  const filteredTasks = getFilteredTasks(selectedDate);
  const progress = getTaskProgress(selectedDate);

  const allSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  // Quick Task Create for Today
  const handleQuickAdd = async () => {
    if (!newTitle.trim()) return;
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId('task'),
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      description: newNotes.trim() || undefined,
      category: newCategory,
      priority: newPriority,
      type: settings.taskTypes[0] || 'Project',
      date: selectedDate,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    await createTask(newTask);
    setNewTitle('');
    setNewNotes('');
    setIsComposerExpanded(false);
  };

  return (
    <View style={styles.rootWrapper}>
      {/* 0. Top View Switcher: Today vs Upcoming */}
      <View
        style={[
          styles.topBarWrapper,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <View
          style={[
            styles.viewSwitchContainer,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.viewSwitchButton,
              activeView === 'today' && [
                styles.viewSwitchButtonActive,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ],
            ]}
            onPress={() => setSelectedTab('today')}
            activeOpacity={0.7}
          >
            <CheckSquare
              size={14}
              color={activeView === 'today' ? '#8B5CF6' : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                {
                  color: activeView === 'today' ? theme.textPrimary : theme.textSecondary,
                  fontWeight: activeView === 'today' ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewSwitchButton,
              activeView === 'upcoming' && [
                styles.viewSwitchButtonActive,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ],
            ]}
            onPress={() => setSelectedTab('upcoming')}
            activeOpacity={0.7}
          >
            <Sparkles
              size={14}
              color={activeView === 'upcoming' ? '#8B5CF6' : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                {
                  color: activeView === 'upcoming' ? theme.textPrimary : theme.textSecondary,
                  fontWeight: activeView === 'upcoming' ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeView === 'upcoming' ? (
        <FutureTaskManager />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.containerContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Sleek Search & Add Controls Bar (Borderless Search Input!) */}
          <View style={styles.searchBarRow}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                },
              ]}
            >
              <Search size={16} color={theme.textMuted} style={styles.searchIcon} />
              <TextInput
                placeholder="Search today's tasks..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: theme.textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <X size={15} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Add Modal Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              style={[styles.addModalBtn, { backgroundColor: theme.primary }]}
              accessibilityLabel="Add task modal"
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 2. Compact Daily Progress Banner */}
          <View
            style={[
              styles.progressBanner,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.progressTopRow}>
              <View style={styles.progressTitleGroup}>
                <View
                  style={[
                    styles.progressIconBadge,
                    { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
                  ]}
                >
                  <CheckSquare size={16} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={[styles.progressMainText, { color: theme.textPrimary }]}>
                    {"Today's Schedule"}
                  </Text>
                  <Text style={[styles.progressSubText, { color: theme.textSecondary }]}>
                    {progress.completed} of {progress.total} completed ({progress.percentage}%)
                  </Text>
                </View>
              </View>

              {progress.pending > 0 ? (
                <View
                  style={[
                    styles.pendingBadge,
                    { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
                  ]}
                >
                  <Text style={styles.pendingBadgeText}>{progress.pending} pending</Text>
                </View>
              ) : progress.total > 0 ? (
                <View
                  style={[
                    styles.pendingBadge,
                    { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
                  ]}
                >
                  <Text style={[styles.pendingBadgeText, { color: '#059669' }]}>All done! 🎉</Text>
                </View>
              ) : null}
            </View>

            {/* Thin Sleek Progress Line */}
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
                    backgroundColor: progress.percentage === 100 ? '#10B981' : theme.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* 3. Filter Chips Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {(['ALL', 'PENDING', 'COMPLETED'] as const).map((st) => {
              const active = filterStatus === st;
              const label =
                st === 'ALL'
                  ? 'All Tasks'
                  : st === 'PENDING'
                  ? `Pending (${progress.pending})`
                  : `Completed (${progress.completed})`;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setFilterStatus(st)}
                  style={[
                    styles.filterChip,
                    active && { backgroundColor: theme.primary, borderColor: theme.primary },
                    !active && { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.filterDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              onPress={() => setFilterCategory('ALL')}
              style={[
                styles.filterChip,
                filterCategory === 'ALL' && { backgroundColor: theme.primary, borderColor: theme.primary },
                filterCategory !== 'ALL' && { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterCategory === 'ALL' ? '#FFFFFF' : theme.textSecondary },
                  filterCategory === 'ALL' && styles.filterChipTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {settings.taskCategories.map((cat) => {
              const active = filterCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFilterCategory(active ? 'ALL' : cat)}
                  style={[
                    styles.filterChip,
                    active && {
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE',
                      borderColor: '#8B5CF6',
                    },
                    !active && { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#8B5CF6' : theme.textSecondary },
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4. Quick-Add Task Composer for Today (Borderless text inputs!) */}
          <View style={styles.composerWrapper}>
            <View
              style={[
                styles.composerCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: isComposerExpanded
                    ? (isDark ? 'rgba(139, 92, 246, 0.5)' : '#8B5CF6')
                    : theme.border,
                },
              ]}
            >
              {!isComposerExpanded ? (
                /* Collapsed Composer */
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setIsComposerExpanded(true)}
                  style={styles.composerCollapsed}
                >
                  <Text style={[styles.composerPlaceholder, { color: theme.textMuted }]}>
                    Add a task for today...
                  </Text>
                  <View style={styles.composerCollapsedActions}>
                    <View style={styles.collapsedIconBtn}>
                      <Plus size={16} color={theme.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                /* Expanded Composer */
                <View style={styles.composerExpanded}>
                  {/* Borderless Title */}
                  <TextInput
                    style={[styles.composerTitleInput, { color: theme.textPrimary }]}
                    placeholder="Task title"
                    placeholderTextColor={theme.textMuted}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    autoFocus
                  />

                  {/* Borderless Notes */}
                  <TextInput
                    style={[styles.composerNoteInput, { color: theme.textPrimary }]}
                    placeholder="Add details, notes or steps (optional)..."
                    placeholderTextColor={theme.textMuted}
                    value={newNotes}
                    onChangeText={setNewNotes}
                    multiline
                  />

                  {/* Category Selector Pills */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {settings.taskCategories.map((c) => {
                      const active = newCategory === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setNewCategory(c)}
                          style={[
                            styles.composerMiniPill,
                            active && {
                              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE',
                              borderColor: '#8B5CF6',
                            },
                            !active && { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.composerMiniPillText,
                              { color: active ? '#8B5CF6' : theme.textSecondary },
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Priority Selector Pills */}
                  <View style={styles.composerPriorityRow}>
                    {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => {
                      const active = newPriority === p;
                      const pColor = p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981';
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setNewPriority(p)}
                          style={[
                            styles.composerMiniPill,
                            active && {
                              backgroundColor: `${pColor}20`,
                              borderColor: pColor,
                            },
                            !active && { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.composerMiniPillText,
                              { color: active ? pColor : theme.textSecondary },
                            ]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.composerFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsComposerExpanded(false);
                        setNewTitle('');
                        setNewNotes('');
                      }}
                      style={styles.composerCancelBtn}
                    >
                      <Text style={[styles.composerCancelBtnText, { color: theme.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleQuickAdd}
                      style={[styles.composerSaveBtn, { backgroundColor: theme.primary }]}
                    >
                      <Text style={styles.composerSaveBtnText}>Add Task</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 5. Bulk Action Bar (Visible when tasks selected) */}
          {selectedTaskIds.length > 0 && (
            <View
              style={[
                styles.bulkActionBar,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                  borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE',
                },
              ]}
            >
              <Text style={[styles.bulkCountText, { color: theme.primary }]}>
                {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
              </Text>
              <View style={styles.bulkButtons}>
                <AppButton
                  title="Mark Completed"
                  size="sm"
                  variant="success"
                  icon={<Check size={14} color="#ffffff" />}
                  onPress={() => bulkComplete(true)}
                />
                <AppButton
                  title="Mark Incomplete"
                  size="sm"
                  variant="outline"
                  onPress={() => bulkComplete(false)}
                />
                <AppButton
                  title="Forward"
                  size="sm"
                  variant="outline"
                  icon={<CornerUpRight size={14} color={theme.primary} />}
                  onPress={handleBulkForward}
                />
                <AppButton
                  title="Delete Selected"
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={14} color="#ffffff" />}
                  onPress={() => setBulkDeleteConfirmOpen(true)}
                />
                <AppButton
                  title="Cancel"
                  size="sm"
                  variant="ghost"
                  onPress={clearSelection}
                />
              </View>
            </View>
          )}

          {/* 6. Tasks List (Desktop Spreadsheet Table vs Mobile Cards) */}
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                {searchQuery ? 'No matching tasks found' : 'No tasks scheduled for today'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with different keywords or clearing filters.'
                  : 'Add a new task using the composer above to start your day!'}
              </Text>
            </View>
          ) : isDesktop ? (
            /* Desktop Spreadsheet Table */
            <View
              style={[
                styles.tableCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.tableHeader,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.thCell, { width: 50 }]}>
                  <AppCheckbox
                    checked={allSelected}
                    onToggle={() => selectAllTasks(selectedDate)}
                    size={18}
                  />
                </View>
                <View style={[styles.thCell, { width: 110 }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Category</Text>
                </View>
                <View style={[styles.thCell, { width: 90 }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Type</Text>
                </View>
                <View style={[styles.thCell, { width: 90 }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Priority</Text>
                </View>
                <View style={[styles.thCell, { width: 130 }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Project / List</Text>
                </View>
                <View style={[styles.thCell, { flex: 1 }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Task Description</Text>
                </View>
                <View style={[styles.thCell, { width: 160 }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Notes</Text>
                </View>
                <View style={[styles.thCell, { width: 110, justifyContent: 'flex-end' }]}>
                  <Text style={[styles.thText, { color: theme.textMuted }]}>Actions</Text>
                </View>
              </View>

              {filteredTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);
                return (
                  <View
                    key={task.id}
                    style={[
                      styles.tableRow,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF')
                          : task.completed
                          ? (isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA')
                          : theme.surface,
                        borderBottomColor: theme.border,
                      },
                      task.completed && styles.tableRowCompleted,
                    ]}
                  >
                    <View style={[styles.tdCell, { width: 50, flexDirection: 'row', gap: 6 }]}>
                      <TouchableOpacity
                        onPress={() => toggleSelectTask(task.id)}
                        style={{ opacity: 0.6 }}
                      >
                        <View
                          style={[
                            styles.smallBox,
                            { borderColor: theme.border },
                            isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                          ]}
                        />
                      </TouchableOpacity>
                      <AppCheckbox
                        checked={task.completed}
                        onToggle={() => toggleTaskComplete(task.id)}
                        size={18}
                      />
                    </View>

                    <View style={[styles.tdCell, { width: 110 }]}>
                      <AppBadge label={task.category} variant="category" size="sm" />
                    </View>

                    <View style={[styles.tdCell, { width: 90 }]}>
                      <Text style={[styles.tdTextMuted, { color: theme.textSecondary }]}>{task.type}</Text>
                    </View>

                    <View style={[styles.tdCell, { width: 90 }]}>
                      <AppBadge
                        label={task.priority}
                        variant="priority"
                        priority={task.priority}
                        size="sm"
                      />
                    </View>

                    <View style={[styles.tdCell, { width: 130 }]}>
                      <Text style={[styles.tdTextBold, { color: theme.textPrimary }]} numberOfLines={1}>
                        {task.projectName || '—'}
                      </Text>
                    </View>

                    <View style={[styles.tdCell, { flex: 1 }]}>
                      <View style={{ flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            style={[
                              styles.tdTextTitle,
                              { color: theme.textPrimary },
                              task.completed && styles.tdTextCompleted,
                            ]}
                          >
                            {task.title}
                          </Text>
                          {task.forwardCount && task.forwardCount > 0 ? (
                            <ForwardBadge
                              count={task.forwardCount}
                              originalDate={task.originalDate}
                              size="sm"
                              showOriginalDate={true}
                            />
                          ) : null}
                        </View>
                        {task.description && task.description !== task.title ? (
                          <Text
                            style={[styles.tdTextDesc, { color: theme.textMuted }]}
                            numberOfLines={1}
                          >
                            {task.description.replace(/\n/g, ' ')}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={[styles.tdCell, { width: 160 }]}>
                      <Text style={[styles.tdTextNotes, { color: theme.textMuted }]} numberOfLines={2}>
                        {task.notes || '—'}
                      </Text>
                    </View>

                    <View style={[styles.tdCell, { width: 110, justifyContent: 'flex-end', flexDirection: 'row', gap: 6 }]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleForwardSingle(task)}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: isDark ? 'rgba(99,102,241,0.14)' : '#EEF2FF' },
                        ]}
                        accessibilityLabel="Forward to tomorrow"
                      >
                        <CornerUpRight size={14} color="#8B5CF6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setEditingTask(task);
                          setModalOpen(true);
                        }}
                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5' }]}
                        accessibilityLabel="Edit task"
                      >
                        <Edit2 size={15} color={theme.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setDeleteConfirmId(task.id)}
                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' }]}
                        accessibilityLabel="Delete task"
                      >
                        <Trash2 size={15} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Mobile Cards View (Clean & Modern like Upcoming) */
            /* Mobile Cards View (Clean, Spacious & Production-Grade) */
            <View style={styles.mobileCardsContainer}>
              {filteredTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);
                const hasDesc = !!task.description && task.description.trim() !== task.title.trim();

                return (
                  <View
                    key={task.id}
                    style={[
                      styles.mobileTaskCard,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF')
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.primary
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : '#E2E8F0',
                      },
                      task.completed && styles.mobileTaskCardCompleted,
                    ]}
                  >
                    {/* Header Row: Checkbox + Full-width Title + Deferral Badge */}
                    <View style={styles.mobileCardHeader}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleTaskComplete(task.id)}
                        style={styles.cardCheckBtn}
                        accessibilityLabel="Toggle complete"
                      >
                        {task.completed ? (
                          <CheckSquare size={19} color="#10B981" />
                        ) : (
                          <Square size={19} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setEditingTask(task);
                          setModalOpen(true);
                        }}
                        style={styles.cardTitleArea}
                      >
                        <Text
                          style={[
                            styles.mobileTaskTitle,
                            { color: theme.textPrimary },
                            task.completed && styles.mobileTaskTitleCompleted,
                          ]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>
                      </TouchableOpacity>

                      {task.forwardCount && task.forwardCount > 0 ? (
                        <ForwardBadge
                          count={task.forwardCount}
                          originalDate={task.originalDate}
                          size="sm"
                        />
                      ) : null}
                    </View>

                    {/* Description or Notes Snippet (Indented nicely) */}
                    {(hasDesc || task.notes) ? (
                      <View style={styles.mobileDescArea}>
                        {hasDesc && (
                          <Text
                            style={[styles.mobileDescText, { color: theme.textSecondary }]}
                            numberOfLines={2}
                          >
                            {task.description!.replace(/\n/g, ' ')}
                          </Text>
                        )}
                        {task.notes && task.notes !== task.description && (
                          <Text
                            style={[styles.mobileNotesText, { color: theme.textMuted }]}
                            numberOfLines={1}
                          >
                            📝 {task.notes}
                          </Text>
                        )}
                      </View>
                    ) : null}

                    {/* Footer Row: Metadata Chips (Left) + Quick Actions (Right) */}
                    <View style={styles.mobileCardFooter}>
                      <View style={styles.mobileCardChipsRow}>
                        <AppBadge label={task.category} variant="category" size="sm" />
                        <AppBadge
                          label={task.priority}
                          variant="priority"
                          priority={task.priority}
                          size="sm"
                        />
                        {task.projectName ? (
                          <View
                            style={[
                              styles.projectChip,
                              {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.projectChipText, { color: theme.textSecondary }]}
                              numberOfLines={1}
                            >
                              📁 {task.projectName}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Action buttons: Tomorrow postponement + Edit + Delete */}
                      <View style={styles.mobileCardActions}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleForwardSingle(task)}
                          style={[
                            styles.mobileActionIconBtn,
                            {
                              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
                            },
                          ]}
                          accessibilityLabel="Postpone to tomorrow"
                        >
                          <CornerUpRight size={13.5} color={theme.primary} strokeWidth={2.4} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setEditingTask(task);
                            setModalOpen(true);
                          }}
                          style={[
                            styles.mobileActionIconBtn,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F4F4F5' },
                          ]}
                          accessibilityLabel="Edit task"
                        >
                          <Edit2 size={13} color={theme.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setDeleteConfirmId(task.id)}
                          style={[
                            styles.mobileActionIconBtn,
                            { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' },
                          ]}
                          accessibilityLabel="Delete task"
                        >
                          <Trash2 size={13} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Task Edit / Add Form Modal */}
      <TaskFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task?"
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

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        visible={bulkDeleteConfirmOpen}
        title="Delete Selected Tasks"
        message={`Are you sure you want to delete ${selectedTaskIds.length} selected tasks?`}
        confirmText="Delete All"
        destructive={true}
        onConfirm={async () => {
          await bulkDelete();
          setBulkDeleteConfirmOpen(false);
        }}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
      />

      {/* Production Floating Toast Snackbar */}
      {forwardToast && (
        <View
          style={[
            styles.floatingSnackbar,
            {
              backgroundColor: isDark ? '#18181B' : '#0F172A',
            },
          ]}
        >
          <View style={styles.snackbarLeft}>
            <View style={styles.snackbarIconBadge}>
              <CornerUpRight size={13} color="#818CF8" strokeWidth={2.4} />
            </View>
            <View style={styles.snackbarTextCol}>
              <Text style={styles.snackbarTitle} numberOfLines={1}>
                {forwardToast.isBulk
                  ? `${forwardToast.bulkCount} tasks postponed to tomorrow`
                  : `Postponed to tomorrow (${formatAdaptiveDate(forwardToast.newDate, 'short')})`}
              </Text>
              {!forwardToast.isBulk && (
                <Text style={styles.snackbarSub} numberOfLines={1}>
                  {forwardToast.count}x transferred • {forwardToast.taskTitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.snackbarActions}>
            {!forwardToast.isBulk && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleUndoForward}
                style={styles.snackbarUndoBtn}
                accessibilityLabel="Undo postponement"
              >
                <RotateCcw size={11} color="#A5B4FC" />
                <Text style={styles.snackbarUndoText}>Undo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSelectedDate(forwardToast.newDate);
                setForwardToast(null);
              }}
              style={styles.snackbarViewBtn}
            >
              <Text style={styles.snackbarViewText}>View →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  topBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  viewSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    height: 38,
    alignItems: 'center',
    gap: 4,
  },
  viewSwitchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    borderRadius: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewSwitchButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewSwitchText: {
    fontSize: 13,
  },

  /* Today Container */
  container: {
    flex: 1,
  },
  containerContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },

  /* Search Bar Row (Borderless input!) */
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  clearSearchBtn: {
    padding: 4,
  },
  addModalBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Compact Daily Progress Banner */
  progressBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressMainText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  progressSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Filter Chips Row */
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontWeight: '700',
  },
  filterDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 4,
  },

  /* Quick Composer Card (Borderless inputs!) */
  composerWrapper: {
    width: '100%',
  },
  composerCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 44,
  },
  composerPlaceholder: {
    fontSize: 13,
    fontWeight: '500',
  },
  composerCollapsedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerExpanded: {
    padding: 14,
  },
  composerTitleInput: {
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
    marginBottom: 8,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  composerNoteInput: {
    fontSize: 13,
    lineHeight: 20,
    minHeight: 50,
    padding: 0,
    marginBottom: 10,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  composerMiniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  composerMiniPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  composerPriorityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  composerCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  composerCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  composerSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  composerSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Bulk Action Bar */
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  /* Empty state */
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
  },

  /* Desktop Table */
  tableCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  thCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tableRowCompleted: {
    opacity: 0.75,
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tdTextBold: {
    fontSize: 13,
    fontWeight: '600',
  },
  tdTextTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  tdTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  tdTextMuted: {
    fontSize: 12,
  },
  tdTextNotes: {
    fontSize: 12,
  },
  smallBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  actionBtn: {
    padding: 7,
    borderRadius: 8,
  },

  tdTextDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },

  /* Mobile Task Cards (Modern & Clean like Linear / Things 3) */
  mobileCardsContainer: {
    gap: 10,
    paddingBottom: 24,
  },
  mobileTaskCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mobileTaskCardCompleted: {
    opacity: 0.65,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardCheckBtn: {
    paddingTop: 1,
    paddingRight: 2,
  },
  cardTitleArea: {
    flex: 1,
  },
  mobileTaskTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.15,
  },
  mobileTaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  mobileDescArea: {
    paddingLeft: 31,
    gap: 2,
    marginTop: -2,
  },
  mobileDescText: {
    fontSize: 12,
    lineHeight: 16.5,
  },
  mobileNotesText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  mobileCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 31,
    paddingTop: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  mobileCardChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  projectChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  projectChipText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  mobileCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileActionIconBtn: {
    width: 27,
    height: 27,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Floating Toast Snackbar */
  floatingSnackbar: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
    gap: 8,
  },
  snackbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  snackbarIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(129, 140, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackbarTextCol: {
    flex: 1,
    minWidth: 0,
  },
  snackbarTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  snackbarSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 0.5,
  },
  snackbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  snackbarUndoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  snackbarUndoText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  snackbarViewBtn: {
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  snackbarViewText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
