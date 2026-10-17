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
import { Task, TaskHorizon } from '../../types';
import { FutureTaskFormModal } from './FutureTaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { KEEP_COLORS, getKeepCardStyle } from './keepTheme';
import { generateId } from '../../utils/id';
import {
  Search,
  Pin,
  Palette,
  LayoutGrid,
  List as ListIcon,
  CheckSquare,
  Square,
  Zap,
  Trash2,
  Edit3,
  Clock,
  Tag,
  X,
  Bell,
  Plus,
} from 'lucide-react-native';

const QUICK_LABELS = [
  'Architecture',
  'Deep Learning',
  'Finance',
  'Health',
  'Quick Wins',
];

const HORIZON_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pinned', label: '📌 Pinned' },
  { id: 'next_7_days', label: '⚡ Next 7 Days' },
  { id: 'this_month', label: '📅 This Month' },
  { id: 'someday', label: '💡 Someday' },
  { id: 'completed', label: '✅ Done' },
];

function formatShortHeading(heading: string): string {
  return heading
    .replace(' & Reliability', '')
    .replace(' & Skill Mastery', '')
    .replace(' & Financial Planning', '')
    .replace(' & Health Optimization', '')
    .replace(' (Free Time)', '')
    .trim();
}

interface ChecklistDraftItem {
  id: string;
  text: string;
  completed: boolean;
}

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
    toggleChecklistItem,
  } = useTaskStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Inline "Take a note / future task..." composer state
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [composerMode, setComposerMode] = useState<'text' | 'checklist'>('text');
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newChecklist, setNewChecklist] = useState<ChecklistDraftItem[]>([]);
  const [newHeading, setNewHeading] = useState(QUICK_LABELS[0]);
  const [newHorizon, setNewHorizon] = useState<TaskHorizon>('next_7_days');
  const [newColor, setNewColor] = useState('default');
  const [newPinned, setNewPinned] = useState(false);
  const [showComposerColorPicker, setShowComposerColorPicker] = useState(false);
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
      } else if (activeFilter.startsWith('label:')) {
        const labelName = activeFilter.replace('label:', '');
        if (t.completed) return false;
        if (t.heading !== labelName && t.category !== labelName) return false;
      }

      // 3. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesHeading = (t.heading || '').toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesChecklist = (t.checklist || []).some((item) =>
          item.text.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesHeading && !matchesNotes && !matchesCategory && !matchesChecklist) {
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

  // Quick Inline Note / Task Save
  const handleSaveInlineNote = async () => {
    if (!newTitle.trim() && !newNotes.trim() && newChecklist.length === 0) {
      setIsComposerExpanded(false);
      return;
    }

    const now = new Date().toISOString();
    const validChecklist = newChecklist
      .filter((item) => item.text.trim().length > 0)
      .map((item) => ({ ...item, text: item.text.trim() }));

    const created: Task = {
      id: generateId('task'),
      heading: newHeading,
      title: newTitle.trim() || (validChecklist[0]?.text ?? 'Untitled Task'),
      notes: newNotes.trim() || undefined,
      checklist: validChecklist.length > 0 ? validChecklist : undefined,
      category: 'Office',
      type: 'Project',
      priority: 'Medium',
      horizon: newHorizon,
      estimatedTime: '30m',
      date: newHorizon === 'someday' ? 'someday' : selectedDate,
      dueDate: newHorizon === 'someday' ? undefined : selectedDate,
      isUpcoming: true,
      pinned: newPinned,
      color: newColor,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await createTask(created);

    // Reset composer state
    setNewTitle('');
    setNewNotes('');
    setNewChecklist([]);
    setNewPinned(false);
    setNewColor('default');
    setShowComposerColorPicker(false);
    setIsComposerExpanded(false);
  };

  const handleAddChecklistItem = () => {
    setNewChecklist((prev) => [
      ...prev,
      { id: generateId('chk'), text: '', completed: false },
    ]);
  };

  const handleUpdateChecklistItem = (id: string, text: string) => {
    setNewChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setNewChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  // Render a Note / Task Card
  const renderCard = (task: Task) => {
    const cardStyle = getKeepCardStyle(task.color, isDark, theme.surface, theme.border);
    const isShowingColorPicker = showColorPickerForId === task.id;
    const isGrid = viewMode === 'grid';

    return (
      <View
        key={task.id}
        style={[
          styles.noteCard,
          isGrid
            ? isDesktop
              ? styles.cardGridDesktop
              : styles.cardGridMobile
            : styles.cardList,
          {
            backgroundColor: cardStyle.backgroundColor,
            borderColor: cardStyle.borderColor,
          },
          task.completed && styles.noteCardCompleted,
        ]}
      >
        {/* Card Header: Checkbox for task done + Title + Pin Icon */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleTaskComplete(task.id)}
            style={styles.cardCompleteBtn}
            accessibilityLabel="Mark complete"
          >
            {task.completed ? (
              <CheckSquare size={16} color="#10B981" />
            ) : (
              <Square size={16} color={cardStyle.subTextColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardTitleArea}
            activeOpacity={0.8}
            onPress={() => {
              setEditingTask(task);
              setEditModalOpen(true);
            }}
          >
            <Text
              style={[
                styles.cardTitle,
                isGrid && !isDesktop && styles.cardTitleGridMobile,
                { color: cardStyle.textColor },
                task.completed && styles.cardTitleCompleted,
              ]}
              numberOfLines={isGrid ? 3 : 2}
            >
              {task.title}
            </Text>
          </TouchableOpacity>

          {/* Pin Icon */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => togglePinTask(task.id)}
            style={styles.pinBtn}
            accessibilityLabel={task.pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin
              size={15}
              color={task.pinned ? '#F59E0B' : cardStyle.subTextColor}
              fill={task.pinned ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Card Body: Interactive Checklist OR Notes Text */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setEditingTask(task);
            setEditModalOpen(true);
          }}
          style={styles.cardBody}
        >
          {task.checklist && task.checklist.length > 0 ? (
            <View style={styles.checklistList}>
              {task.checklist.slice(0, isGrid && !isDesktop ? 3 : 5).map((chk) => (
                <View key={chk.id} style={styles.checklistItemRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleChecklistItem(task.id, chk.id)}
                    style={styles.chkToggle}
                  >
                    {chk.completed ? (
                      <CheckSquare size={13} color="#10B981" />
                    ) : (
                      <Square size={13} color={cardStyle.subTextColor} />
                    )}
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.checklistText,
                      isGrid && !isDesktop && { fontSize: 11 },
                      { color: cardStyle.textColor },
                      chk.completed && styles.checklistTextCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {chk.text}
                  </Text>
                </View>
              ))}
              {task.checklist.length > (isGrid && !isDesktop ? 3 : 5) && (
                <Text style={[styles.moreItemsText, { color: cardStyle.subTextColor }]}>
                  +{task.checklist.length - (isGrid && !isDesktop ? 3 : 5)} more
                </Text>
              )}
            </View>
          ) : task.notes ? (
            <Text
              style={[
                styles.cardNotes,
                isGrid && !isDesktop && styles.cardNotesGridMobile,
                { color: cardStyle.textColor },
                task.completed && styles.cardNotesCompleted,
              ]}
              numberOfLines={isGrid && !isDesktop ? 3 : 5}
            >
              {task.notes}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Card Chips: Workstream Label, Reminder, Effort */}
        <View style={styles.cardChipsRow}>
          {task.heading && (
            <View
              style={[
                styles.cardChip,
                isGrid && !isDesktop && styles.cardChipMobile,
                {
                  backgroundColor: cardStyle.chipBg,
                  borderColor: cardStyle.chipBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardChipText,
                  isGrid && !isDesktop && styles.cardChipTextMobile,
                  { color: cardStyle.textColor },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatShortHeading(task.heading)}
              </Text>
            </View>
          )}

          {task.horizon && (
            <View
              style={[
                styles.cardChip,
                isGrid && !isDesktop && styles.cardChipMobile,
                {
                  backgroundColor: cardStyle.chipBg,
                  borderColor: cardStyle.chipBorder,
                },
              ]}
            >
              <Bell size={isGrid && !isDesktop ? 8 : 10} color={cardStyle.subTextColor} />
              <Text
                style={[
                  styles.cardChipText,
                  isGrid && !isDesktop && styles.cardChipTextMobile,
                  { color: cardStyle.textColor },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.horizon === 'next_7_days'
                  ? 'Next 7 Days'
                  : task.horizon === 'this_month'
                  ? 'This Month'
                  : 'Someday'}
              </Text>
            </View>
          )}

          {task.estimatedTime && (
            <View
              style={[
                styles.cardChip,
                isGrid && !isDesktop && styles.cardChipMobile,
                {
                  backgroundColor: cardStyle.chipBg,
                  borderColor: cardStyle.chipBorder,
                },
              ]}
            >
              <Clock size={isGrid && !isDesktop ? 8 : 10} color={cardStyle.subTextColor} />
              <Text
                style={[
                  styles.cardChipText,
                  isGrid && !isDesktop && styles.cardChipTextMobile,
                  { color: cardStyle.textColor },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.estimatedTime}
              </Text>
            </View>
          )}
        </View>

        {/* Color Palette Popover Row */}
        {isShowingColorPicker && (
          <View
            style={[
              styles.palettePopover,
              {
                backgroundColor: isDark ? '#23252A' : '#FFFFFF',
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

        {/* Card Action Toolbar */}
        <View style={[styles.cardFooter, isGrid && !isDesktop && styles.cardFooterMobile]}>
          {/* 1-Tap "⚡ Move to Today" */}
          {!task.completed && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMoveToTodayTask(task)}
              style={[
                styles.doTodayChip,
                isGrid && !isDesktop && styles.doTodayChipMobile,
                {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : '#C4B5FD',
                },
              ]}
            >
              <Zap size={isGrid && !isDesktop ? 9 : 11} color="#8B5CF6" />
              <Text style={[styles.doTodayChipText, isGrid && !isDesktop && styles.doTodayChipTextMobile]}>
                {isGrid && !isDesktop ? 'Today' : '⚡ Do Today'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={[styles.cardActionIcons, isGrid && !isDesktop && styles.cardActionIconsMobile]}>
            {/* Color Palette */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setShowColorPickerForId(isShowingColorPicker ? null : task.id)
              }
              style={[styles.cardActionIconBtn, isGrid && !isDesktop && styles.cardActionIconBtnMobile]}
              accessibilityLabel="Change color"
            >
              <Palette size={isGrid && !isDesktop ? 12 : 14} color={cardStyle.subTextColor} />
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setEditingTask(task);
                setEditModalOpen(true);
              }}
              style={[styles.cardActionIconBtn, isGrid && !isDesktop && styles.cardActionIconBtnMobile]}
              accessibilityLabel="Edit note"
            >
              <Edit3 size={isGrid && !isDesktop ? 11 : 13} color={cardStyle.subTextColor} />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setDeleteConfirmId(task.id)}
              style={[styles.cardActionIconBtn, isGrid && !isDesktop && styles.cardActionIconBtnMobile]}
              accessibilityLabel="Delete note"
            >
              <Trash2 size={isGrid && !isDesktop ? 11 : 13} color={cardStyle.subTextColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Sleek Search & View Controls Bar */}
      <View style={styles.searchBarRow}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Search size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search notes & future tasks..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={15} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Grid vs List View Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
          style={[
            styles.viewModeBtn,
            {
              backgroundColor: theme.surface,
              borderColor: viewMode === 'list' ? theme.primary : theme.border,
            },
          ]}
          accessibilityLabel={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          {viewMode === 'grid' ? (
            <ListIcon size={17} color={theme.textPrimary} />
          ) : (
            <LayoutGrid size={17} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Filter Chips & Color Swatches */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        {HORIZON_FILTERS.map((f) => {
          const active = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={[
                styles.filterChip,
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
                  styles.filterChipText,
                  { color: active ? '#FFFFFF' : theme.textSecondary },
                  active && styles.filterChipTextActive,
                ]}
                numberOfLines={1}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Labels / Workstreams */}
        {QUICK_LABELS.map((label) => {
          const filterKey = `label:${label}`;
          const active = activeFilter === filterKey;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => setActiveFilter(active ? 'all' : filterKey)}
              style={[
                styles.filterChip,
                active && {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE',
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
                  styles.filterChipText,
                  { color: active ? '#8B5CF6' : theme.textSecondary },
                  active && styles.filterChipTextActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Color Filter Dots */}
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

      {/* 3. The "Take a note..." Card Composer */}
      <View style={styles.composerWrapper}>
        <View
          style={[
            styles.composerCard,
            getKeepCardStyle(newColor, isDark, theme.surface, theme.border),
            isComposerExpanded && {
              borderColor: isDark ? 'rgba(139, 92, 246, 0.5)' : '#8B5CF6',
            },
          ]}
        >
          {!isComposerExpanded ? (
            /* Collapsed Note Bar */
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setComposerMode('text');
                setIsComposerExpanded(true);
              }}
              style={styles.composerCollapsed}
            >
              <Text style={[styles.composerPlaceholder, { color: theme.textMuted }]} numberOfLines={1}>
                Take a note...
              </Text>

              <View style={styles.composerCollapsedActions}>
                {/* New checklist */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setComposerMode('checklist');
                    if (newChecklist.length === 0) {
                      setNewChecklist([{ id: generateId('chk'), text: '', completed: false }]);
                    }
                    setIsComposerExpanded(true);
                  }}
                  style={styles.collapsedActionBtn}
                  accessibilityLabel="Checklist note"
                >
                  <CheckSquare size={17} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Quick label */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setIsComposerExpanded(true);
                  }}
                  style={styles.collapsedActionBtn}
                  accessibilityLabel="Workstream label"
                >
                  <Tag size={17} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Quick color */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setIsComposerExpanded(true);
                    setShowComposerColorPicker(true);
                  }}
                  style={styles.collapsedActionBtn}
                  accessibilityLabel="Color palette"
                >
                  <Palette size={17} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            /* Expanded Note Card */
            <View style={styles.composerExpanded}>
              {/* Title row + Pin button */}
              <View style={styles.composerTitleRow}>
                <TextInput
                  style={[styles.composerTitleInput, { color: theme.textPrimary }]}
                  placeholder="Task or Note Title"
                  placeholderTextColor={theme.textMuted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setNewPinned(!newPinned)}
                  style={styles.composerPinBtn}
                  accessibilityLabel={newPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin
                    size={18}
                    color={newPinned ? '#F59E0B' : theme.textSecondary}
                    fill={newPinned ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              {/* Body: Checklist Mode vs Standard Note */}
              {composerMode === 'checklist' ? (
                <View style={styles.composerChecklistBlock}>
                  {newChecklist.map((item) => (
                    <View key={item.id} style={styles.composerChecklistRow}>
                      <Square size={16} color={theme.textSecondary} />
                      <TextInput
                        style={[
                          styles.composerChecklistInput,
                          { color: theme.textPrimary, borderColor: theme.border },
                        ]}
                        placeholder="List item"
                        placeholderTextColor={theme.textMuted}
                        value={item.text}
                        onChangeText={(t) => handleUpdateChecklistItem(item.id, t)}
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveChecklistItem(item.id)}
                        style={styles.removeChkBtn}
                      >
                        <X size={14} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* + Add item */}
                  <TouchableOpacity
                    onPress={handleAddChecklistItem}
                    style={styles.addListItemBtn}
                  >
                    <Plus size={15} color="#8B5CF6" />
                    <Text style={styles.addListItemText}>Add checklist item</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.composerNoteInput,
                    { color: theme.textPrimary },
                  ]}
                  placeholder="Take a note, context or steps (so you never forget)..."
                  placeholderTextColor={theme.textMuted}
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                />
              )}

              {/* Workstream & Horizon Pills */}
              <View style={styles.composerMetaBlock}>
                {/* Heading selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                  {QUICK_LABELS.map((h) => {
                    const active = newHeading === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => setNewHeading(h)}
                        style={[
                          styles.composerMiniPill,
                          active && { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE', borderColor: '#8B5CF6' },
                          !active && { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.composerMiniPillText, { color: active ? '#8B5CF6' : theme.textSecondary }]}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Horizon pills */}
                <View style={styles.composerHorizonRow}>
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
                          styles.composerMiniPill,
                          active && { backgroundColor: theme.primary, borderColor: theme.primary },
                          !active && { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.composerMiniPillText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                          {hz.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Color dots row (if open) */}
              {showComposerColorPicker && (
                <View style={styles.composerColorSwatchesRow}>
                  {KEEP_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setNewColor(c.id);
                        setShowComposerColorPicker(false);
                      }}
                      style={[
                        styles.paletteDot,
                        { backgroundColor: c.dotColor },
                        newColor === c.id && styles.paletteDotSelected,
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Bottom Action Footer */}
              <View style={styles.composerFooter}>
                <View style={styles.composerFooterLeftIcons}>
                  {/* Color Palette Toggle */}
                  <TouchableOpacity
                    onPress={() => setShowComposerColorPicker(!showComposerColorPicker)}
                    style={styles.composerFooterIconBtn}
                    accessibilityLabel="Pick color"
                  >
                    <Palette size={16} color={theme.textSecondary} />
                  </TouchableOpacity>

                  {/* Checklist vs Text Toggle */}
                  <TouchableOpacity
                    onPress={() => {
                      if (composerMode === 'text') {
                        setComposerMode('checklist');
                        if (newChecklist.length === 0) {
                          setNewChecklist([{ id: generateId('chk'), text: '', completed: false }]);
                        }
                      } else {
                        setComposerMode('text');
                      }
                    }}
                    style={styles.composerFooterIconBtn}
                    accessibilityLabel="Toggle checklist"
                  >
                    <CheckSquare size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Cancel & Save Buttons */}
                <View style={styles.composerRightBtns}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowComposerColorPicker(false);
                      setIsComposerExpanded(false);
                    }}
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

      {/* 4. Notes Cards Grid / Feed */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
            {searchQuery ? 'No matching future tasks or notes' : 'Your future task pipeline is clear'}
          </Text>
          <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try adjusting your search terms or clearing active filters.'
              : 'Use the note composer above to capture ideas, checklists, and upcoming tasks!'}
          </Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {/* PINNED Section */}
          {pinnedTasks.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                📌 PINNED
              </Text>
              <View style={viewMode === 'grid' ? (isDesktop ? styles.grid3Col : styles.grid2Col) : styles.listCol}>
                {pinnedTasks.map(renderCard)}
              </View>
            </View>
          )}

          {/* OTHERS / ALL UPCOMING Section */}
          {otherTasks.length > 0 && (
            <View style={styles.sectionBlock}>
              {pinnedTasks.length > 0 && (
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  ALL UPCOMING
                </Text>
              )}
              <View style={viewMode === 'grid' ? (isDesktop ? styles.grid3Col : styles.grid2Col) : styles.listCol}>
                {otherTasks.map(renderCard)}
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
        title="Delete Future Task"
        message="Are you sure you want to remove this item from your future task pipeline?"
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
        title="⚡ Promote to Today's Tasks"
        message={`Move "${moveToTodayTask?.title}" directly onto today's priority schedule?`}
        confirmText="Move to Today"
        destructive={false}
        onConfirm={async () => {
          if (moveToTodayTask) {
            await moveToToday(moveToTodayTask.id, selectedDate);
            setMoveToTodayTask(null);
          }
        }}
        onCancel={() => setMoveToTodayTask(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  /* Search & View Controls Bar */
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  viewModeBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Filter Chips Row */
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 12,
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

  /* Composer */
  composerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  composerCard: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 46,
  },
  composerPlaceholder: {
    fontSize: 14,
    fontWeight: '500',
  },
  composerCollapsedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerExpanded: {
    padding: 14,
  },
  composerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  composerTitleInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
  },
  composerPinBtn: {
    padding: 4,
  },
  composerNoteInput: {
    fontSize: 13,
    lineHeight: 20,
    minHeight: 65,
    padding: 0,
    marginBottom: 10,
  },
  composerChecklistBlock: {
    marginBottom: 10,
  },
  composerChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  composerChecklistInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  removeChkBtn: {
    padding: 4,
  },
  addListItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  addListItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  composerMetaBlock: {
    marginBottom: 10,
  },
  composerMiniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  composerMiniPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  composerHorizonRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  composerColorSwatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
  },
  paletteDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  paletteDotSelected: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  composerFooterLeftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerFooterIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  /* Cards Container */
  cardsContainer: {
    paddingBottom: 40,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 2,
  },
  grid3Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  listCol: {
    flexDirection: 'column',
    gap: 10,
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
  },

  /* Note Card */
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 2,
  },
  cardGridMobile: {
    width: '48.5%',
    minWidth: 0,
    maxWidth: '49%',
    padding: 10,
  },
  cardGridDesktop: {
    width: '31.5%',
    minWidth: 240,
    maxWidth: 380,
    padding: 14,
  },
  cardList: {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    padding: 14,
  },
  cardTitleGridMobile: {
    fontSize: 13,
    lineHeight: 17,
  },
  cardNotesGridMobile: {
    fontSize: 11,
    lineHeight: 16,
  },
  noteCardCompleted: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardCompleteBtn: {
    paddingTop: 1,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  pinBtn: {
    padding: 2,
  },
  cardBody: {
    marginBottom: 10,
  },
  cardNotes: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardNotesCompleted: {
    textDecorationLine: 'line-through',
  },
  checklistList: {
    gap: 4,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chkToggle: {
    padding: 2,
  },
  checklistText: {
    fontSize: 12,
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  moreItemsText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  cardChipMobile: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  cardChipText: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  cardChipTextMobile: {
    fontSize: 9,
  },
  palettePopover: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    width: '100%',
    overflow: 'hidden',
  },
  cardFooterMobile: {
    paddingTop: 4,
    gap: 2,
  },
  doTodayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  doTodayChipMobile: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  doTodayChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  doTodayChipTextMobile: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionIconsMobile: {
    gap: 1,
  },
  cardActionIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionIconBtnMobile: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
});
