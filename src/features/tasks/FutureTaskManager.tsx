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
import { offsetDateKey } from '../../utils/date';
import { ForwardBadge } from './ForwardBadge';
import { HorizontalScrollRow } from '../../components/ui/HorizontalScrollRow';
import { SortableList } from '../../components/ui/SortableList';
import {
  Check,
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
  RotateCcw,
} from 'lucide-react-native';

const PRIORITY_FILTERS: { id: string; label: string; priority: TaskPriority }[] = [
  { id: 'priority:High', label: 'High Priority', priority: 'High' },
  { id: 'priority:Medium', label: 'Moderate', priority: 'Medium' },
  { id: 'priority:Low', label: 'Light', priority: 'Low' },
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

  // Completion feedback & grace period states
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [uncompletingTaskIds, setUncompletingTaskIds] = useState<Set<string>>(new Set());
  const [completionToast, setCompletionToast] = useState<{
    id: string;
    title: string;
    action: 'completed' | 'reactivated';
  } | null>(null);

  React.useEffect(() => {
    if (completionToast) {
      const timer = setTimeout(() => {
        setCompletionToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [completionToast]);

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

  // Dynamic count badges for each horizon filter
  const tabCounts = useMemo(() => {
    const next7DaysEnd = offsetDateKey(selectedDate, 7);
    const currentMonthPrefix = selectedDate.slice(0, 7);

    return {
      all: upcomingTasks.filter((t) => !t.completed).length,
      pinned: upcomingTasks.filter((t) => !t.completed && t.pinned).length,
      next_7_days: upcomingTasks.filter((t) => {
        if (t.completed) return false;
        if (t.horizon === 'next_7_days') return true;
        if (t.date && t.date !== 'someday') {
          const d = t.dueDate || t.date;
          return d >= selectedDate && d <= next7DaysEnd;
        }
        return false;
      }).length,
      this_month: upcomingTasks.filter((t) => {
        if (t.completed) return false;
        if (t.horizon === 'this_month') return true;
        if (t.date && t.date !== 'someday') {
          const d = t.dueDate || t.date;
          return d.startsWith(currentMonthPrefix);
        }
        return false;
      }).length,
      someday: upcomingTasks.filter((t) => {
        if (t.completed) return false;
        return t.horizon === 'someday' || t.date === 'someday' || !t.date;
      }).length,
      completed: upcomingTasks.filter((t) => !!t.completed).length,
    };
  }, [upcomingTasks, selectedDate]);

  const horizonFilterTabs = useMemo(() => [
    { id: 'all', label: `All (${tabCounts.all})` },
    { id: 'pinned', label: `Pinned (${tabCounts.pinned})` },
    { id: 'next_7_days', label: `Next 7 Days (${tabCounts.next_7_days})` },
    { id: 'this_month', label: `This Month (${tabCounts.this_month})` },
    { id: 'someday', label: `Someday (${tabCounts.someday})` },
    { id: 'completed', label: `Completed (${tabCounts.completed})` },
  ], [tabCounts]);

  // Filter & sort tasks based on search, active filter, color
  const filteredTasks = useMemo(() => {
    const next7DaysEnd = offsetDateKey(selectedDate, 7);
    const currentMonthPrefix = selectedDate.slice(0, 7);

    const matchesHorizonFilter = (t: Task): boolean => {
      if (activeFilter === 'completed') {
        return !!t.completed || uncompletingTaskIds.has(t.id);
      }
      if (t.completed && !completingTaskIds.has(t.id)) {
        return false;
      }

      if (activeFilter === 'pinned') {
        return !!t.pinned;
      }
      if (activeFilter === 'all') {
        return true;
      }
      if (activeFilter === 'next_7_days') {
        if (t.horizon === 'next_7_days') return true;
        if (t.date && t.date !== 'someday') {
          const d = t.dueDate || t.date;
          return d >= selectedDate && d <= next7DaysEnd;
        }
        return false;
      }
      if (activeFilter === 'this_month') {
        if (t.horizon === 'this_month') return true;
        if (t.date && t.date !== 'someday') {
          const d = t.dueDate || t.date;
          return d.startsWith(currentMonthPrefix);
        }
        return false;
      }
      if (activeFilter === 'someday') {
        return t.horizon === 'someday' || t.date === 'someday' || !t.date;
      }
      if (activeFilter.startsWith('priority:')) {
        const priorityVal = activeFilter.replace('priority:', '');
        return t.priority === priorityVal;
      }
      return true;
    };

    return upcomingTasks
      .filter((t) => {
        // 1. Horizon / Status filter
        if (!matchesHorizonFilter(t)) {
          return false;
        }

        // 2. Search query
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
      })
      .sort((a, b) => {
        // Pinned tasks float to top
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        // Date urgency (closest date first, someday at the bottom)
        const aDate = a.date === 'someday' ? '9999-99-99' : (a.dueDate || a.date || '9999-99-99');
        const bDate = b.date === 'someday' ? '9999-99-99' : (b.dueDate || b.date || '9999-99-99');
        if (aDate !== bDate) return aDate.localeCompare(bDate);

        // Priority sorting (High > Medium > Low)
        const priorityWeight: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
        const aPrio = priorityWeight[a.priority as string] ?? 1;
        const bPrio = priorityWeight[b.priority as string] ?? 1;
        if (aPrio !== bPrio) return aPrio - bPrio;

        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [upcomingTasks, activeFilter, searchQuery, selectedDate, completingTaskIds, uncompletingTaskIds]);

  // Separate pinned vs others
  const pinnedTasks = useMemo(() => {
    if (activeFilter === 'completed') {
      return []; // Completed tab displays a unified completed list
    }
    return filteredTasks.filter((t) => t.pinned && !t.completed);
  }, [filteredTasks, activeFilter]);

  const otherTasks = useMemo(() => {
    if (activeFilter === 'completed') {
      return filteredTasks; // All completed tasks
    }
    return filteredTasks.filter((t) => !t.pinned || t.completed);
  }, [filteredTasks, activeFilter]);

  // Completion toggle with grace period & toast feedback
  const handleToggleComplete = async (task: Task) => {
    if (!task.completed) {
      setCompletingTaskIds((prev) => new Set(prev).add(task.id));
      await toggleTaskComplete(task.id);
      setCompletionToast({
        id: task.id,
        title: task.title,
        action: 'completed',
      });
      setTimeout(() => {
        setCompletingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 750);
    } else {
      setUncompletingTaskIds((prev) => new Set(prev).add(task.id));
      await toggleTaskComplete(task.id);
      setCompletionToast({
        id: task.id,
        title: task.title,
        action: 'reactivated',
      });
      setTimeout(() => {
        setUncompletingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 750);
    }
  };

  const handleUndoComplete = async () => {
    if (!completionToast) return;
    await toggleTaskComplete(completionToast.id);
    setCompletionToast(null);
  };

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
          isGrid && !isDesktop && styles.noteCardGridMobile,
          isGrid && isDesktop && styles.noteCardGridDesktop,
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
        <View style={[styles.cardHeader, isGrid && !isDesktop && styles.cardHeaderMobile]}>
          <View style={styles.cardTitleArea}>
            <Text
              style={[
                styles.cardTitle,
                isGrid && !isDesktop && styles.cardTitleGridMobile,
                { color: cardStyle.textColor },
                task.completed && styles.cardTitleCompleted,
              ]}
              numberOfLines={2}
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
        <View style={[styles.cardBody, isGrid && styles.cardBodyGrid]}>
          {task.checklist && task.checklist.length > 0 ? (
            <View style={styles.checklistList}>
              {task.checklist.slice(0, isGrid ? 2 : 4).map((chk) => (
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
              numberOfLines={isGrid ? 2 : 4}
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
          {/* Left: Today Chip (most left) + Checkbox */}
          <View style={styles.cardFooterLeft} {...interactiveProps}>
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
                  {isGrid && !isDesktop ? '+ Today' : '+ Move to Today'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.completed }}
              {...interactiveProps}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                handleToggleComplete(task);
              }}
              onPointerDown={(e: any) => e?.stopPropagation?.()}
              onTouchStart={(e: any) => e?.stopPropagation?.()}
              style={[
                styles.checkboxTouchTarget,
                isGrid && !isDesktop && styles.checkboxTouchTargetMobile,
              ]}
              accessibilityLabel={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed ? (
                <View style={styles.completedPill}>
                  <View
                    style={[
                      styles.checkboxSquare,
                      styles.checkboxSquareChecked,
                      isGrid && !isDesktop && styles.checkboxSquareMobile,
                    ]}
                  >
                    <Check size={isGrid && !isDesktop ? 9 : 11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.completedPillText, { color: isDark ? '#34D399' : '#059669' }]}>
                    Done
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.checkboxSquare,
                    isGrid && !isDesktop && styles.checkboxSquareMobile,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.32)' : 'rgba(0, 0, 0, 0.25)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
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
    <View style={styles.rootWrapper}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

      {/* 2. Filter Chips */}
      <HorizontalScrollRow
        paddingHorizontal={16}
        gap={6}
      >
        {horizonFilterTabs.map((f) => {
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
            {searchQuery
              ? 'No matching future tasks or notes'
              : activeFilter === 'completed'
              ? 'No completed tasks yet'
              : 'Your future task pipeline is clear'}
          </Text>
          <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try adjusting your search terms or clearing active filters.'
              : activeFilter === 'completed'
              ? 'When you check off upcoming tasks, they are organized here so you can review or restore them anytime.'
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

          {/* OTHERS / ALL UPCOMING / COMPLETED Section */}
          {otherTasks.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {activeFilter === 'completed'
                  ? `COMPLETED TASKS (${otherTasks.length})`
                  : pinnedTasks.length > 0
                  ? 'ALL UPCOMING'
                  : ''}
              </Text>
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

      {/* Floating Completion Feedback Snackbar */}
      {completionToast && (
        <View
          style={[
            styles.floatingSnackbar,
            {
              backgroundColor: isDark ? '#18181B' : '#0F172A',
            },
          ]}
        >
          <View style={styles.snackbarLeft}>
            <View
              style={[
                styles.snackbarIconBadge,
                {
                  backgroundColor:
                    completionToast.action === 'completed'
                      ? 'rgba(16, 185, 129, 0.16)'
                      : 'rgba(99, 102, 241, 0.16)',
                },
              ]}
            >
              {completionToast.action === 'completed' ? (
                <Check size={13} color="#10B981" strokeWidth={3} />
              ) : (
                <RotateCcw size={13} color="#818CF8" strokeWidth={2.4} />
              )}
            </View>
            <View style={styles.snackbarTextCol}>
              <Text style={styles.snackbarTitle} numberOfLines={1}>
                {completionToast.action === 'completed' ? 'Task Completed' : 'Task Restored'}
              </Text>
              <Text style={styles.snackbarSub} numberOfLines={1}>
                {completionToast.title
                  ? `${completionToast.title} • ${
                      completionToast.action === 'completed'
                        ? 'Moved to Completed tab'
                        : 'Moved to active tasks'
                    }`
                  : completionToast.action === 'completed'
                  ? 'Moved to Completed tab'
                  : 'Moved to active tasks'}
              </Text>
            </View>
          </View>

          <View style={styles.snackbarActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleUndoComplete}
              style={styles.snackbarUndoBtn}
              accessibilityLabel="Undo action"
            >
              <RotateCcw size={11} color="#A5B4FC" />
              <Text style={styles.snackbarUndoText}>Undo</Text>
            </TouchableOpacity>

            {completionToast.action === 'completed' && activeFilter !== 'completed' && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setActiveFilter('completed');
                  setCompletionToast(null);
                }}
                style={styles.snackbarViewBtn}
              >
                <Text style={styles.snackbarViewText}>View →</Text>
              </TouchableOpacity>
            )}

            {completionToast.action === 'reactivated' && activeFilter === 'completed' && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setActiveFilter('all');
                  setCompletionToast(null);
                }}
                style={styles.snackbarViewBtn}
              >
                <Text style={styles.snackbarViewText}>View Active →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    position: 'relative',
  },
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
  noteCardGridMobile: {
    height: 146,
    minHeight: 146,
    maxHeight: 146,
  },
  noteCardGridDesktop: {
    height: 168,
    minHeight: 168,
    maxHeight: 168,
  },
  cardHeaderMobile: {
    minHeight: 34,
    marginBottom: 2,
  },
  cardBodyGrid: {
    flex: 1,
    minHeight: 36,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    marginBottom: 4,
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
    marginTop: 'auto',
    paddingTop: 5,
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
  checkboxTouchTarget: {
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  checkboxTouchTargetMobile: {
    height: 22,
    paddingHorizontal: 1,
  },
  checkboxSquare: {
    width: 16,
    height: 16,
    borderRadius: 4.5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareMobile: {
    width: 14.5,
    height: 14.5,
    borderRadius: 4,
    borderWidth: 1.4,
  },
  checkboxSquareChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  completedPillText: {
    fontSize: 10,
    fontWeight: '700',
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
