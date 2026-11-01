import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDateStore } from '../../stores/useDateStore';
import { Task, TaskHorizon, TaskPriority } from '../../types';
import { FutureTaskFormModal } from './FutureTaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { KEEP_COLORS, getKeepCardStyle } from './keepTheme';
import { generateId } from '../../utils/id';
import { ForwardBadge } from './ForwardBadge';
import { HorizontalScrollRow } from '../../components/ui/HorizontalScrollRow';
import { SortableList } from '../../components/ui/SortableList';
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
  X,
  Plus,
  Maximize2,
} from 'lucide-react-native';

const PRIORITY_FILTERS: { id: string; label: string; priority: TaskPriority }[] = [
  { id: 'priority:High', label: 'High Priority', priority: 'High' },
  { id: 'priority:Medium', label: 'Moderate', priority: 'Medium' },
  { id: 'priority:Low', label: 'Light', priority: 'Low' },
];

const HORIZON_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'next_7_days', label: 'Next 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'someday', label: 'Someday' },
  { id: 'completed', label: 'Done' },
];

interface ChecklistDraftItem {
  id: string;
  text: string;
  completed: boolean;
}

const interactiveProps = {
  dataSet: { interactive: 'true' },
  'data-interactive': 'true',
} as any;

export const FutureTaskManager: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const { selectedDate } = useDateStore();
  const {
    tasks,
    createTask,
    reorderTasks,
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
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
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
      } else if (activeFilter.startsWith('priority:')) {
        const priorityVal = activeFilter.replace('priority:', '');
        if (t.completed) return false;
        if (t.priority !== priorityVal) return false;
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
      title: newTitle.trim() || (validChecklist[0]?.text ?? 'Untitled Task'),
      notes: newNotes.trim() || undefined,
      checklist: validChecklist.length > 0 ? validChecklist : undefined,
      category: 'Office',
      type: 'Project',
      priority: newPriority,
      horizon: newHorizon,
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
          {
            width: '100%',
            padding: isGrid ? (isDesktop ? 12 : 8) : 12,
            backgroundColor: cardStyle.backgroundColor,
            borderColor: cardStyle.borderColor,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                } as any)
              : {}),
          },
          task.completed && styles.noteCardCompleted,
        ]}
      >
        {/* Card Header: Clean Note Title + Optional Forward Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
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
          </View>

          {task.forwardCount && task.forwardCount > 0 ? (
            <ForwardBadge
              count={task.forwardCount}
              originalDate={task.originalDate}
              size="sm"
            />
          ) : null}
        </View>

        {/* Card Body: Interactive Checklist OR Notes Text */}
        <View style={styles.cardBody}>
          {task.checklist && task.checklist.length > 0 ? (
            <View style={styles.checklistList}>
              {task.checklist.slice(0, isGrid && !isDesktop ? 3 : 5).map((chk) => (
                <View key={chk.id} style={styles.checklistItemRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: chk.completed }}
                    {...interactiveProps}
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      toggleChecklistItem(task.id, chk.id);
                    }}
                    onPointerDown={(e: any) => e?.stopPropagation?.()}
                    onTouchStart={(e: any) => e?.stopPropagation?.()}
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
        </View>

        {/* Color Palette Popover Row */}
        {isShowingColorPicker && (
          <View
            style={[
              styles.palettePopover,
              {
                backgroundColor: isDark ? '#23252A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.14)' : '#CBD5E1',
              },
            ]}
            {...interactiveProps}
            onPointerDown={(e: any) => e?.stopPropagation?.()}
            onTouchStart={(e: any) => e?.stopPropagation?.()}
          >
            {KEEP_COLORS.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.7}
                accessibilityRole="button"
                {...interactiveProps}
                onPress={async (e: any) => {
                  e?.stopPropagation?.();
                  await updateTaskColor(task.id, c.id);
                  setShowColorPickerForId(null);
                }}
                onPointerDown={(e: any) => e?.stopPropagation?.()}
                onTouchStart={(e: any) => e?.stopPropagation?.()}
                style={[
                  styles.paletteDot,
                  { backgroundColor: c.dotColor },
                  task.color === c.id && styles.paletteDotSelected,
                ]}
                accessibilityLabel={`Set note color to ${c.name}`}
              />
            ))}
          </View>
        )}

        {/* Card Action Toolbar (Lower Bar: Checkbox + Today on Left | Pin + Color + Delete on Right) */}
        <View
          style={[styles.cardFooter, isGrid && !isDesktop && styles.cardFooterMobile]}
          {...interactiveProps}
        >
          {/* Left: Complete Checkbox + Do Today Chip */}
          <View style={styles.cardFooterLeft} {...interactiveProps}>
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.completed }}
              {...interactiveProps}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                toggleTaskComplete(task.id);
              }}
              onPointerDown={(e: any) => e?.stopPropagation?.()}
              onTouchStart={(e: any) => e?.stopPropagation?.()}
              style={[
                styles.cardCompleteBtn,
                isGrid && !isDesktop && styles.cardCompleteBtnMobile,
                task.completed && {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                },
              ]}
              accessibilityLabel={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed ? (
                <CheckSquare size={isGrid && !isDesktop ? 13 : 15} color="#10B981" />
              ) : (
                <Square size={isGrid && !isDesktop ? 13 : 15} color={cardStyle.subTextColor} />
              )}
            </TouchableOpacity>

            {!task.completed && (
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                {...interactiveProps}
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  setMoveToTodayTask(task);
                }}
                onPointerDown={(e: any) => e?.stopPropagation?.()}
                onTouchStart={(e: any) => e?.stopPropagation?.()}
                style={[
                  styles.doTodayChip,
                  isGrid && !isDesktop && styles.doTodayChipMobile,
                  {
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                    borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : '#C4B5FD',
                  },
                ]}
                accessibilityLabel="Move to today"
              >
                <Zap size={isGrid && !isDesktop ? 9 : 11} color="#8B5CF6" strokeWidth={2.4} />
                <Text
                  style={[
                    styles.doTodayChipText,
                    isGrid && !isDesktop && styles.doTodayChipTextMobile,
                  ]}
                >
                  {isGrid && !isDesktop ? 'Today' : 'Do Today'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right Action Icons: Pin + Color Palette + Edit (Desktop) + Delete */}
          <View
            style={[
              styles.cardActionIcons,
              isGrid && !isDesktop && styles.cardActionIconsMobile,
            ]}
            {...interactiveProps}
          >
            {/* Pin Toggle */}
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              {...interactiveProps}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                togglePinTask(task.id);
              }}
              onPointerDown={(e: any) => e?.stopPropagation?.()}
              onTouchStart={(e: any) => e?.stopPropagation?.()}
              style={[
                styles.cardActionIconBtn,
                isGrid && !isDesktop && styles.cardActionIconBtnMobile,
                task.pinned && {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.22)' : '#FEF3C7',
                },
              ]}
              accessibilityLabel={task.pinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin
                size={isGrid && !isDesktop ? 12 : 13}
                color={task.pinned ? '#F59E0B' : cardStyle.subTextColor}
                fill={task.pinned ? '#F59E0B' : 'transparent'}
              />
            </TouchableOpacity>

            {/* Color Palette Toggle */}
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              {...interactiveProps}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                setShowColorPickerForId(isShowingColorPicker ? null : task.id);
              }}
              onPointerDown={(e: any) => e?.stopPropagation?.()}
              onTouchStart={(e: any) => e?.stopPropagation?.()}
              style={[
                styles.cardActionIconBtn,
                isGrid && !isDesktop && styles.cardActionIconBtnMobile,
                isShowingColorPicker && {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE',
                },
              ]}
              accessibilityLabel="Change note color"
            >
              <Palette
                size={isGrid && !isDesktop ? 12 : 13}
                color={isShowingColorPicker ? '#8B5CF6' : cardStyle.subTextColor}
              />
            </TouchableOpacity>

            {/* Edit (List & Desktop only; on mobile grid, tapping card opens editor) */}
            {(!isGrid || isDesktop) && (
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                {...interactiveProps}
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  setEditingTask(task);
                  setEditModalOpen(true);
                }}
                onPointerDown={(e: any) => e?.stopPropagation?.()}
                onTouchStart={(e: any) => e?.stopPropagation?.()}
                style={styles.cardActionIconBtn}
                accessibilityLabel="Edit note"
              >
                <Edit3 size={13} color={cardStyle.subTextColor} />
              </TouchableOpacity>
            )}

            {/* Delete */}
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              {...interactiveProps}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                setDeleteConfirmId(task.id);
              }}
              onPointerDown={(e: any) => e?.stopPropagation?.()}
              onTouchStart={(e: any) => e?.stopPropagation?.()}
              style={[
                styles.cardActionIconBtn,
                isGrid && !isDesktop && styles.cardActionIconBtnMobile,
              ]}
              accessibilityLabel="Delete note"
            >
              <Trash2 size={isGrid && !isDesktop ? 12 : 13} color={cardStyle.subTextColor} />
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
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
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
      <HorizontalScrollRow
        paddingHorizontal={16}
        gap={6}
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

        {/* Priority Filter Chips */}
        {PRIORITY_FILTERS.map((pf) => {
          const active = activeFilter === pf.id;
          return (
            <TouchableOpacity
              key={pf.id}
              onPress={() => setActiveFilter(active ? 'all' : pf.id)}
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
                {pf.label}
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
      </HorizontalScrollRow>

      {/* 3. The "Take a note..." Card Composer */}
      <View style={styles.composerWrapper}>
        <View
          style={[
            styles.composerCard,
            getKeepCardStyle(newColor, isDark, theme.surface, theme.border),
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
            /* Expanded Note Card (Neat & Clean) */
            <View style={styles.composerExpanded}>
              {/* Title row + Actions */}
              <View style={styles.composerTitleRow}>
                <TextInput
                  style={[styles.composerTitleInput, { color: theme.textPrimary }]}
                  placeholder="Title"
                  placeholderTextColor={theme.textMuted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
                <View style={styles.composerTopRightActions}>
                  {/* Pin button */}
                  <TouchableOpacity
                    onPress={() => setNewPinned(!newPinned)}
                    style={styles.composerIconBtn}
                    accessibilityLabel={newPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin
                      size={16}
                      color={newPinned ? '#F59E0B' : theme.textSecondary}
                      fill={newPinned ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>

                  {/* Open in full Google Keep editor modal */}
                  <TouchableOpacity
                    onPress={() => {
                      setIsComposerExpanded(false);
                      setEditingTask(null);
                      setEditModalOpen(true);
                    }}
                    style={styles.composerIconBtn}
                    accessibilityLabel="Open in full note editor"
                  >
                    <Maximize2 size={15} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Body: Checklist Mode vs Standard Note */}
              {composerMode === 'checklist' ? (
                <View style={styles.composerChecklistBlock}>
                  {newChecklist.map((item) => (
                    <View key={item.id} style={styles.composerChecklistRow}>
                      <Square size={15} color={theme.textSecondary} />
                      <TextInput
                        style={[
                          styles.composerChecklistInput,
                          { color: theme.textPrimary },
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
                        <X size={13} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* + Add item */}
                  <TouchableOpacity
                    onPress={handleAddChecklistItem}
                    style={styles.addListItemBtn}
                  >
                    <Plus size={14} color="#8B5CF6" />
                    <Text style={styles.addListItemText}>Add item</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.composerNoteInput,
                    { color: theme.textPrimary },
                  ]}
                  placeholder="Take a note..."
                  placeholderTextColor={theme.textMuted}
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                />
              )}

              {/* Single Sleek Horizontally Scrollable Row for Horizon & Tags (Clean gap) */}
              <View style={styles.composerMetaBlock}>
                <HorizontalScrollRow
                  edgeToEdge={false}
                  paddingHorizontal={0}
                  gap={5}
                >
                  {/* Priority pills */}
                  {[
                    { id: 'High' as TaskPriority, label: 'High' },
                    { id: 'Medium' as TaskPriority, label: 'Moderate' },
                    { id: 'Low' as TaskPriority, label: 'Light' },
                  ].map((p) => {
                    const active = newPriority === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setNewPriority(p.id)}
                        style={[
                          styles.composerMiniPill,
                          active && { backgroundColor: theme.primary, borderColor: theme.primary },
                          !active && { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.composerMiniPillText,
                            { color: active ? '#FFFFFF' : theme.textSecondary },
                            active && { fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />

                  {/* Horizon pills */}
                  {[
                    { id: 'next_7_days', label: '7 Days' },
                    { id: 'this_month', label: 'Month' },
                    { id: 'someday', label: 'Someday' },
                  ].map((hz) => {
                    const active = newHorizon === hz.id;
                    return (
                      <TouchableOpacity
                        key={hz.id}
                        onPress={() => setNewHorizon(active ? 'next_7_days' : hz.id as any)}
                        style={[
                          styles.composerMiniPill,
                          active && { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE', borderColor: '#8B5CF6' },
                          !active && { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.composerMiniPillText,
                            { color: active ? '#8B5CF6' : theme.textSecondary },
                            active && { fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {hz.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </HorizontalScrollRow>
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
                    <Text style={styles.composerSaveBtnText}>Save</Text>
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
                PINNED
              </Text>
              <SortableList
                data={pinnedTasks}
                keyExtractor={(task) => task.id}
                onReorder={reorderTasks}
                onItemPress={(task) => {
                  setEditingTask(task);
                  setEditModalOpen(true);
                }}
                contentContainerStyle={viewMode === 'grid' ? (isDesktop ? styles.grid3Col : styles.grid2Col) : styles.listCol}
                itemWrapperStyle={viewMode === 'grid' ? (isDesktop ? styles.cardGridDesktop : styles.cardGridMobile) : styles.cardList}
                renderItem={({ item: task }) => renderCard(task)}
              />
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
              <SortableList
                data={otherTasks}
                keyExtractor={(task) => task.id}
                onReorder={reorderTasks}
                onItemPress={(task) => {
                  setEditingTask(task);
                  setEditModalOpen(true);
                }}
                contentContainerStyle={viewMode === 'grid' ? (isDesktop ? styles.grid3Col : styles.grid2Col) : styles.listCol}
                itemWrapperStyle={viewMode === 'grid' ? (isDesktop ? styles.cardGridDesktop : styles.cardGridMobile) : styles.cardList}
                renderItem={({ item: task }) => renderCard(task)}
              />
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
        title="Promote to Today's Tasks"
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
    marginBottom: 6,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 9999,
    borderWidth: 0,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
    outlineStyle: 'none' as any,
  },
  clearSearchBtn: {
    padding: 4,
  },
  viewModeBtn: {
    width: 38,
    height: 38,
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
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
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
    width: 18,
    height: 18,
    borderRadius: 9,
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
    marginBottom: 6,
  },
  composerCard: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 38,
  },
  composerPlaceholder: {
    fontSize: 13,
    fontWeight: '500',
  },
  composerCollapsedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerExpanded: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  composerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  composerTopRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTitleInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  composerPinBtn: {
    padding: 4,
  },
  composerNoteInput: {
    fontSize: 12,
    lineHeight: 17,
    minHeight: 26,
    padding: 0,
    marginBottom: 4,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  composerChecklistBlock: {
    marginBottom: 4,
  },
  composerChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  composerChecklistInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  removeChkBtn: {
    padding: 2,
  },
  addListItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  addListItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  composerMetaBlock: {
    marginBottom: 4,
  },
  composerHorizontalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 1,
  },
  metaDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 1,
    opacity: 0.35,
  },
  composerMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  composerMiniPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  composerColorSwatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 6,
  },
  paletteDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.12)',
  },
  composerFooterLeftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerFooterIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  composerCancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  composerSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  composerSaveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Cards Container */
  cardsContainer: {
    paddingBottom: 40,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 2,
  },
  grid3Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  listCol: {
    flexDirection: 'column',
    gap: 8,
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
  },

  /* Note Card */
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 0,
    ...(Platform.OS === 'web'
      ? ({
          transition: 'background-color 0.22s ease, border-color 0.22s ease, box-shadow 0.2s ease',
        } as any)
      : {}),
  },
  cardGridMobile: {
    width: '48.5%',
    minWidth: 0,
    maxWidth: '49%',
    padding: 0,
  },
  cardGridDesktop: {
    width: '31.5%',
    minWidth: 240,
    maxWidth: 380,
    padding: 0,
  },
  cardList: {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    padding: 0,
  },
  cardNotesGridMobile: {
    fontSize: 10,
    lineHeight: 14,
  },
  noteCardCompleted: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  cardTitleGridMobile: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  cardBody: {
    marginBottom: 6,
  },
  cardNotes: {
    fontSize: 11,
    lineHeight: 15,
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
  cardChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
    marginBottom: 4,
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
    paddingTop: 5,
    gap: 3,
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  cardCompleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCompleteBtnMobile: {
    width: 22,
    height: 22,
    borderRadius: 5,
  },
  doTodayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
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
    gap: 2,
  },
  cardActionIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionIconBtnMobile: {
    width: 21,
    height: 21,
    borderRadius: 5,
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
