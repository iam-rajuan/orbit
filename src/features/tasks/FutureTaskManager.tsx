import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDateStore } from '../../stores/useDateStore';
import { Task, TaskHorizon, TaskPriority, TaskCategory } from '../../types';
import { FutureTaskFormModal } from './FutureTaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { KEEP_COLORS, getKeepCardStyle } from './keepTheme';
import { generateId } from '../../utils/id';
import { offsetDateKey, getTodayKey } from '../../utils/date';
import {
  Search,
  Pin,
  Palette,
  LayoutGrid,
  List as ListIcon,
  Check,
  CheckSquare,
  Zap,
  Trash2,
  Edit2,
  Clock,
  Tag,
  X,
  FileText,
} from 'lucide-react-native';

const QUICK_HEADING_PRESETS = [
  '🏗️ Core Architecture',
  '🧠 Deep Learning',
  '💼 Career & Finance',
  '🏡 Personal & Health',
  '⚡ Quick Wins',
];

const HORIZON_FILTER_OPTIONS = [
  { id: 'all', label: 'All Notes' },
  { id: 'pinned', label: '📌 Pinned' },
  { id: 'next_7_days', label: '⚡ Next 7 Days' },
  { id: 'this_month', label: '📅 This Month' },
  { id: 'someday', label: '💡 Free Time (Someday)' },
  { id: 'completed', label: '✅ Done' },
];

export const FutureTaskManager: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const { selectedDate } = useDateStore();
  const {
    tasks,
    createTask,
    toggleTaskComplete,
    deleteTask,
    moveToToday,
    togglePinTask,
    updateTaskColor,
  } = useTaskStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Inline "Take a note..." state
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newHeading, setNewHeading] = useState(QUICK_HEADING_PRESETS[0]);
  const [newHorizon, setNewHorizon] = useState<TaskHorizon>('next_7_days');
  const [newEffort, setNewEffort] = useState('30m');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newColor, setNewColor] = useState('default');
  const [newPinned, setNewPinned] = useState(false);
  const [showColorPickerForId, setShowColorPickerForId] = useState<string | null>(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [moveToTodayTask, setMoveToTodayTask] = useState<Task | null>(null);

  // Identify all upcoming / future tasks
  const upcomingTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isExplicitUpcoming = t.isUpcoming === true;
      const hasHorizon = !!t.horizon;
      const isSomeday = t.date === 'someday';
      const isFutureDate = t.date > selectedDate;
      return isExplicitUpcoming || hasHorizon || isSomeday || isFutureDate;
    });
  }, [tasks, selectedDate]);

  // Filter tasks based on search, active filter, color
  const filteredTasks = useMemo(() => {
    return upcomingTasks.filter((t) => {
      // 1. Color filter
      if (selectedColorFilter && (t.color || 'default') !== selectedColorFilter) {
        return false;
      }

      // 2. Horizon / Label filter
      if (activeFilter === 'completed') {
        if (!t.completed) return false;
      } else if (activeFilter === 'pinned') {
        if (t.completed || !t.pinned) return false;
      } else if (activeFilter === 'all') {
        if (t.completed) return false;
      } else if (activeFilter === 'next_7_days' || activeFilter === 'this_month' || activeFilter === 'someday') {
        if (t.completed) return false;
        if (t.horizon !== activeFilter && t.date !== activeFilter) return false;
      } else if (activeFilter.startsWith('heading:')) {
        const hName = activeFilter.replace('heading:', '');
        if (t.completed || t.heading !== hName) return false;
      }

      // 3. Search query
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
  }, [upcomingTasks, activeFilter, selectedColorFilter, searchQuery]);

  // Separate pinned vs others
  const pinnedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.pinned && !t.completed);
  }, [filteredTasks]);

  const otherTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.pinned || t.completed);
  }, [filteredTasks]);

  // Quick Inline Note Save (Google Keep style)
  const handleSaveInlineNote = async () => {
    if (!newTitle.trim() && !newNotes.trim()) {
      setIsComposerExpanded(false);
      return;
    }

    const titleToUse = newTitle.trim() || newNotes.trim().split('\n')[0] || 'Untitled Note';
    const notesToUse = newTitle.trim() ? newNotes.trim() : newNotes.trim().split('\n').slice(1).join('\n');
    const now = new Date().toISOString();
    const finalDate = newHorizon === 'someday' ? 'someday' : offsetDateKey(getTodayKey(), 3);

    const newTask: Task = {
      id: generateId('task'),
      heading: newHeading,
      title: titleToUse,
      notes: notesToUse || undefined,
      category: 'Office' as TaskCategory,
      type: 'Project',
      priority: newPriority,
      horizon: newHorizon,
      estimatedTime: newEffort,
      date: finalDate,
      dueDate: finalDate !== 'someday' ? finalDate : undefined,
      isUpcoming: true,
      pinned: newPinned,
      color: newColor,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await createTask(newTask);

    // Reset inline composer
    setNewTitle('');
    setNewNotes('');
    setNewHeading(QUICK_HEADING_PRESETS[0]);
    setNewHorizon('next_7_days');
    setNewEffort('30m');
    setNewPriority('Medium');
    setNewColor('default');
    setNewPinned(false);
    setIsComposerExpanded(false);
  };

  const handleConfirmMoveToToday = async () => {
    if (!moveToTodayTask) return;
    await moveToToday(moveToTodayTask.id, selectedDate);
    setMoveToTodayTask(null);
  };

  // Render a Single Google Keep Card
  const renderKeepCard = (task: Task) => {
    const cardStyle = getKeepCardStyle(task.color, isDark, theme.surface, theme.border);
    const isShowingColorPicker = showColorPickerForId === task.id;

    return (
      <View
        key={task.id}
        style={[
          styles.keepCard,
          cardStyle,
          viewMode === 'list' && styles.keepCardList,
          task.completed && styles.keepCardCompleted,
        ]}
      >
        {/* Top Header of Card: Checkbox, Title, Pin */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleTaskComplete(task.id)}
            style={styles.cardCheckBtn}
          >
            {task.completed ? (
              <View style={[styles.cardCheckboxActive, { backgroundColor: theme.primary }]}>
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
            ) : (
              <View style={[styles.cardCheckbox, { borderColor: theme.textMuted }]} />
            )}
          </TouchableOpacity>

          <Text
            style={[
              styles.cardTitle,
              { color: theme.textPrimary },
              task.completed && styles.cardTitleCompleted,
            ]}
          >
            {task.title}
          </Text>

          {/* Google Keep Pin Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => togglePinTask(task.id)}
            style={[
              styles.cardPinBtn,
              task.pinned && {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE',
              },
            ]}
          >
            <Pin
              size={15}
              color={task.pinned ? '#8B5CF6' : theme.textMuted}
              fill={task.pinned ? '#8B5CF6' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Card Note Body */}
        {task.notes ? (
          <Text style={[styles.cardNotes, { color: theme.textSecondary }]}>
            {task.notes}
          </Text>
        ) : null}

        {/* Keep Style Chips / Labels */}
        <View style={styles.cardChipsRow}>
          {/* Heading / Workstream chip */}
          {task.heading && (
            <View
              style={[
                styles.cardChip,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              <Text style={[styles.cardChipText, { color: theme.textSecondary }]}>
                {task.heading}
              </Text>
            </View>
          )}

          {/* Horizon / Reminder chip */}
          <View
            style={[
              styles.cardChip,
              {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF',
                borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#E9D5FF',
              },
            ]}
          >
            <Clock size={10} color="#8B5CF6" />
            <Text style={[styles.cardChipText, { color: '#8B5CF6', fontWeight: '700' }]}>
              {task.horizon === 'someday' || task.date === 'someday'
                ? 'Free Time'
                : task.date || 'Next 7 Days'}
            </Text>
          </View>

          {/* Effort chip */}
          {task.estimatedTime && (
            <View
              style={[
                styles.cardChip,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                },
              ]}
            >
              <Zap size={10} color="#10B981" />
              <Text style={[styles.cardChipText, { color: '#059669', fontWeight: '700' }]}>
                {task.estimatedTime}
              </Text>
            </View>
          )}
        </View>

        {/* Color Palette Popover Row (if active) */}
        {isShowingColorPicker && (
          <View
            style={[
              styles.palettePopover,
              {
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderColor: theme.border,
              },
            ]}
          >
            {KEEP_COLORS.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={async () => {
                  await updateTaskColor(task.id, c.id);
                  setShowColorPickerForId(null);
                }}
                style={[
                  styles.paletteDot,
                  { backgroundColor: c.dotColor },
                  task.color === c.id && styles.paletteDotSelected,
                ]}
              />
            ))}
          </View>
        )}

        {/* Card Action Toolbar (Google Keep style) */}
        <View style={styles.cardFooter}>
          {/* 1-Tap "⚡ Move to Today" (Orbit Superpower) */}
          {!task.completed && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMoveToTodayTask(task)}
              style={[
                styles.doTodayChip,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
                },
              ]}
            >
              <Zap size={11} color="#4F46E5" />
              <Text style={styles.doTodayChipText}>⚡ Do Today</Text>
            </TouchableOpacity>
          )}

          <View style={styles.cardActionIcons}>
            {/* Color Palette Icon */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setShowColorPickerForId(isShowingColorPicker ? null : task.id)
              }
              style={styles.cardActionIconBtn}
            >
              <Palette size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Edit Icon */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setEditingTask(task);
                setEditModalOpen(true);
              }}
              style={styles.cardActionIconBtn}
            >
              <Edit2 size={13} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Delete Icon */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setDeleteConfirmId(task.id)}
              style={styles.cardActionIconBtn}
            >
              <Trash2 size={13} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Google Keep Search & Layout Bar */}
      <View style={styles.searchBarWrapper}>
        <View
          style={[
            styles.keepSearchBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Search size={18} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search future tasks & notes..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}

          {/* Grid vs List View Toggle (Google Keep Style) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewModeBtn}
          >
            {viewMode === 'grid' ? (
              <ListIcon size={18} color={theme.textSecondary} />
            ) : (
              <LayoutGrid size={18} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Google Keep Label / Horizon Filter Chips (Horizontal Scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsScroll}
      >
        {HORIZON_FILTER_OPTIONS.map((opt) => {
          const active = activeFilter === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.7}
              onPress={() => setActiveFilter(opt.id)}
              style={[
                styles.keepFilterChip,
                active && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
                !active && {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.keepFilterChipText,
                  { color: active ? '#FFFFFF' : theme.textSecondary },
                  active && styles.keepFilterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Headings as Labels */}
        {QUICK_HEADING_PRESETS.map((h) => {
          const filterKey = `heading:${h}`;
          const active = activeFilter === filterKey;
          return (
            <TouchableOpacity
              key={h}
              activeOpacity={0.7}
              onPress={() => setActiveFilter(active ? 'all' : filterKey)}
              style={[
                styles.keepFilterChip,
                active && {
                  backgroundColor: '#8B5CF6',
                  borderColor: '#8B5CF6',
                },
                !active && {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.keepFilterChipText,
                  { color: active ? '#FFFFFF' : theme.textSecondary },
                  active && styles.keepFilterChipTextActive,
                ]}
              >
                {h}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Color Filter Swatches */}
        {KEEP_COLORS.filter((c) => c.id !== 'default').map((c) => {
          const active = selectedColorFilter === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedColorFilter(active ? null : c.id)}
              style={[
                styles.colorFilterDot,
                { backgroundColor: c.dotColor },
                active && styles.colorFilterDotActive,
              ]}
            />
          );
        })}
      </ScrollView>

      {/* 3. Google Keep "Take a Note..." Quick Task Composer */}
      <View style={styles.composerWrapper}>
        <View
          style={[
            styles.keepComposerCard,
            getKeepCardStyle(newColor, isDark, theme.surface, theme.border),
            { borderColor: isComposerExpanded ? theme.primary : theme.border },
          ]}
        >
          {!isComposerExpanded ? (
            /* Collapsed "Take a note..." Bar */
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsComposerExpanded(true)}
              style={styles.composerCollapsed}
            >
              <Text style={[styles.composerPlaceholder, { color: theme.textMuted }]}>
                Take a future task / note...
              </Text>

              <View style={styles.composerQuickActions}>
                <View style={styles.composerIconBtn}>
                  <CheckSquare size={16} color={theme.textMuted} />
                </View>
                <View style={styles.composerIconBtn}>
                  <Tag size={16} color={theme.textMuted} />
                </View>
                <View style={styles.composerIconBtn}>
                  <Palette size={16} color={theme.textMuted} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            /* Expanded Note Composer (Google Keep style) */
            <View style={styles.composerExpanded}>
              {/* Title row with Pin icon */}
              <View style={styles.composerTitleRow}>
                <TextInput
                  style={[styles.composerTitleInput, { color: theme.textPrimary }]}
                  placeholder="Title"
                  placeholderTextColor={theme.textMuted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setNewPinned(!newPinned)}
                  style={[
                    styles.composerPinBtn,
                    newPinned && { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' },
                  ]}
                >
                  <Pin
                    size={16}
                    color={newPinned ? '#8B5CF6' : theme.textMuted}
                    fill={newPinned ? '#8B5CF6' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              {/* Note Content Input */}
              <TextInput
                style={[styles.composerNoteInput, { color: theme.textPrimary }]}
                placeholder="Take a note, checklist or steps..."
                placeholderTextColor={theme.textMuted}
                value={newNotes}
                onChangeText={setNewNotes}
                multiline
              />

              {/* Quick Chip Selectors (Heading, Horizon, Effort) */}
              <View style={styles.composerChipsRow}>
                {/* Heading selector pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                  {QUICK_HEADING_PRESETS.map((h) => {
                    const active = newHeading === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => setNewHeading(h)}
                        style={[
                          styles.composerMiniChip,
                          active && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
                          !active && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.composerMiniChipText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Horizon pills */}
                <View style={styles.composerOptionRow}>
                  {[
                    { id: 'next_7_days', label: '⚡ Next 7 Days' },
                    { id: 'this_month', label: '📅 This Month' },
                    { id: 'someday', label: '💡 When I Have Time' },
                  ].map((hz) => {
                    const active = newHorizon === hz.id;
                    return (
                      <TouchableOpacity
                        key={hz.id}
                        onPress={() => setNewHorizon(hz.id as any)}
                        style={[
                          styles.composerMiniChip,
                          active && { backgroundColor: theme.primary, borderColor: theme.primary },
                          !active && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.composerMiniChipText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                          {hz.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Bottom Actions: Color dots & Close Button */}
              <View style={styles.composerFooter}>
                {/* Color Swatches */}
                <View style={styles.composerColorDots}>
                  {KEEP_COLORS.slice(0, 8).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setNewColor(c.id)}
                      style={[
                        styles.composerColorDot,
                        { backgroundColor: c.dotColor },
                        newColor === c.id && styles.composerColorDotActive,
                      ]}
                    />
                  ))}
                </View>

                {/* Close & Add Button */}
                <View style={styles.composerRightBtns}>
                  <TouchableOpacity
                    onPress={() => setIsComposerExpanded(false)}
                    style={styles.composerCancelBtn}
                  >
                    <Text style={[styles.composerCancelBtnText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveInlineNote}
                    style={[styles.composerSaveBtn, { backgroundColor: theme.primary }]}
                  >
                    <Text style={styles.composerSaveBtnText}>Save Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 4. Google Keep Cards Section */}
      {filteredTasks.length === 0 ? (
        <View
          style={[
            styles.emptyKeepState,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <FileText size={48} color={theme.textMuted} />
          <Text style={[styles.emptyKeepTitle, { color: theme.textPrimary }]}>
            {searchQuery
              ? 'No matching notes found'
              : 'Your future task notebook is clear'}
          </Text>
          <Text style={[styles.emptyKeepSub, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try a different search word or clear filters.'
              : 'Use the quick input bar above to take note of what is up ahead!'}
          </Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {/* Pinned Section (if any pinned notes exist) */}
          {pinnedTasks.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                PINNED
              </Text>
              <View style={viewMode === 'grid' ? (isDesktop ? styles.grid3Col : styles.grid2Col) : styles.listCol}>
                {pinnedTasks.map(renderKeepCard)}
              </View>
            </View>
          )}

          {/* Others Section */}
          {otherTasks.length > 0 && (
            <View style={styles.sectionBlock}>
              {pinnedTasks.length > 0 && (
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                  OTHERS
                </Text>
              )}
              <View style={viewMode === 'grid' ? (isDesktop ? styles.grid3Col : styles.grid2Col) : styles.listCol}>
                {otherTasks.map(renderKeepCard)}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Edit Modal */}
      <FutureTaskFormModal
        visible={editModalOpen}
        taskToEdit={editingTask}
        onClose={() => {
          setEditModalOpen(false);
          setEditingTask(null);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Future Task Note"
        message="Are you sure you want to delete this note from your future task pipeline?"
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchBarWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  keepSearchBar: {
    width: '100%',
    maxWidth: 680,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  clearSearchBtn: {
    padding: 6,
  },
  viewModeBtn: {
    padding: 8,
    marginLeft: 4,
  },
  filterChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 12,
  },
  keepFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  keepFilterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  keepFilterChipTextActive: {
    fontWeight: '700',
  },
  colorFilterDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    marginHorizontal: 2,
  },
  colorFilterDotActive: {
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.25 }],
  },
  composerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  keepComposerCard: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  composerPlaceholder: {
    fontSize: 14,
    fontWeight: '500',
  },
  composerQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  composerIconBtn: {
    padding: 4,
  },
  composerExpanded: {
    padding: 16,
    gap: 10,
  },
  composerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerTitleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 4,
  },
  composerPinBtn: {
    padding: 6,
    borderRadius: 8,
  },
  composerNoteInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  composerChipsRow: {
    gap: 6,
    marginTop: 4,
  },
  composerMiniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  composerMiniChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  composerOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    flexWrap: 'wrap',
    gap: 8,
  },
  composerColorDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  composerColorDotActive: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.15 }],
  },
  composerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  composerCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  composerCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  composerSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  composerSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardsContainer: {
    gap: 16,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  grid3Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  listCol: {
    gap: 10,
  },
  keepCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  keepCardList: {
    minWidth: '100%',
  },
  keepCardCompleted: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardCheckBtn: {
    paddingTop: 2,
  },
  cardCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  cardCheckboxActive: {
    width: 17,
    height: 17,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  cardPinBtn: {
    padding: 4,
    borderRadius: 6,
  },
  cardNotes: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardChipText: {
    fontSize: 10,
  },
  palettePopover: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  paletteDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  paletteDotSelected: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
  },
  doTodayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  doTodayChipText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '700',
  },
  cardActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  cardActionIconBtn: {
    padding: 5,
    borderRadius: 6,
  },
  emptyKeepState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyKeepTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyKeepSub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
});
