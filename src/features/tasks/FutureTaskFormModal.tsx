import React, { useState, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Task, TaskHorizon, TaskPriority } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDateStore } from '../../stores/useDateStore';
import { generateId } from '../../utils/id';
import {
  ArrowLeft,
  Pin,
  Trash2,
  Zap,
  Palette,
  CheckSquare,
  Square,
  Plus,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { KEEP_COLORS, getKeepCardStyle } from './keepTheme';
import { HorizontalScrollRow } from '../../components/ui/HorizontalScrollRow';
import { getTodayKey, offsetDateKey, getWeekdayName } from '../../utils/date';

interface FutureTaskFormModalProps {
  visible: boolean;
  taskToEdit?: Task | null;
  onClose: () => void;
}

// Clean priority options: Light (Low), Moderate (Medium), High (High)
const PRIORITY_OPTIONS: { id: TaskPriority; label: string; activeColor: string; activeBg: string }[] = [
  { id: 'High', label: 'High', activeColor: '#EF4444', activeBg: 'rgba(239, 68, 68, 0.16)' },
  { id: 'Medium', label: 'Moderate', activeColor: '#F59E0B', activeBg: 'rgba(245, 158, 11, 0.16)' },
  { id: 'Low', label: 'Light', activeColor: '#10B981', activeBg: 'rgba(16, 185, 129, 0.16)' },
];

const formatEditedTime = (isoString?: string) => {
  if (!isoString) return 'New note';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) {
      return `Edited ${timeStr}`;
    }
    return `Edited ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  } catch {
    return 'Edited recently';
  }
};

const FutureTaskNoteEditor: React.FC<{
  taskToEdit?: Task | null;
  onClose: () => void;
}> = ({ taskToEdit, onClose }) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { selectedDate } = useDateStore();
  const { createTask, updateTask, deleteTask, moveToToday } = useTaskStore();

  const titleInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  // Note State directly initialized
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || taskToEdit?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'Medium');
  const [color, setColor] = useState(taskToEdit?.color || 'default');
  const [pinned, setPinned] = useState(taskToEdit?.pinned || false);
  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>(
    taskToEdit?.checklist || []
  );

  // Dynamic schedule options based on current date
  const todayKey = getTodayKey();
  const scheduleOptions = useMemo(() => {
    const tomorrow = offsetDateKey(todayKey, 1);
    const day2 = offsetDateKey(todayKey, 2);
    const day3 = offsetDateKey(todayKey, 3);
    const day4 = offsetDateKey(todayKey, 4);

    return [
      { id: 'today', label: 'Today', date: todayKey, horizon: 'next_7_days' as TaskHorizon },
      { id: 'tomorrow', label: 'Tomorrow', date: tomorrow, horizon: 'next_7_days' as TaskHorizon },
      { id: day2, label: getWeekdayName(day2), date: day2, horizon: 'next_7_days' as TaskHorizon },
      { id: day3, label: getWeekdayName(day3), date: day3, horizon: 'next_7_days' as TaskHorizon },
      { id: day4, label: getWeekdayName(day4), date: day4, horizon: 'next_7_days' as TaskHorizon },
      { id: 'next_7_days', label: '7 Days', date: todayKey, horizon: 'next_7_days' as TaskHorizon },
      { id: 'this_month', label: 'This Month', date: todayKey, horizon: 'this_month' as TaskHorizon },
      { id: 'someday', label: 'Someday', date: 'someday', horizon: 'someday' as TaskHorizon },
    ];
  }, [todayKey]);

  // Initial schedule selection
  const [scheduleSelection, setScheduleSelection] = useState<{
    id: string;
    horizon: TaskHorizon;
    date: string;
    label: string;
  }>(() => {
    if (taskToEdit?.date === 'someday' || taskToEdit?.horizon === 'someday') {
      return { id: 'someday', horizon: 'someday', date: 'someday', label: 'Someday' };
    }
    if (taskToEdit?.horizon === 'this_month') {
      return { id: 'this_month', horizon: 'this_month', date: taskToEdit?.date || todayKey, label: 'This Month' };
    }
    if (taskToEdit?.date && taskToEdit.date !== 'someday') {
      if (taskToEdit.date === todayKey) {
        return { id: 'today', horizon: 'next_7_days', date: todayKey, label: 'Today' };
      }
      return { id: taskToEdit.date, horizon: 'next_7_days', date: taskToEdit.date, label: taskToEdit.date };
    }
    return { id: 'today', horizon: 'next_7_days', date: todayKey, label: 'Today' };
  });

  const [customDate, setCustomDate] = useState<string>(
    taskToEdit?.date && taskToEdit.date !== 'someday' && taskToEdit.date !== todayKey
      ? taskToEdit.date
      : ''
  );
  const [showDatePickerInput, setShowDatePickerInput] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Solid background for clean reading without bleed-through
  const cardStyle = getKeepCardStyle(
    color,
    isDark,
    isDark ? '#202124' : '#FFFFFF',
    isDark ? '#3C4043' : '#E2E8F0'
  );

  // Save changes
  const handleSaveAndClose = async () => {
    const finalTitle = title.trim();
    const finalNotes = notes.trim();
    const hasChecklist = checklist.some((c) => c.text.trim().length > 0);

    // If completely empty and new, just close
    if (!finalTitle && !finalNotes && !hasChecklist && !taskToEdit) {
      onClose();
      return;
    }

    const now = new Date().toISOString();
    const finalDate = scheduleSelection.date;
    const finalHorizon = scheduleSelection.horizon;

    if (taskToEdit) {
      const updated: Task = {
        ...taskToEdit,
        title: finalTitle || 'Untitled note',
        notes: finalNotes || undefined,
        description: finalNotes || undefined,
        priority,
        horizon: finalHorizon,
        color,
        pinned,
        checklist: checklist.length > 0 ? checklist : undefined,
        date: finalDate,
        dueDate: finalDate !== 'someday' ? finalDate : undefined,
        updatedAt: now,
      };
      await updateTask(updated);
    } else if (finalTitle || finalNotes || hasChecklist) {
      const newTask: Task = {
        id: generateId('task'),
        title: finalTitle || 'Untitled note',
        notes: finalNotes || undefined,
        description: finalNotes || undefined,
        category: 'Office',
        type: 'Project',
        priority,
        horizon: finalHorizon,
        date: finalDate,
        dueDate: finalDate !== 'someday' ? finalDate : undefined,
        isUpcoming: finalDate !== todayKey,
        pinned,
        color,
        checklist: checklist.length > 0 ? checklist : undefined,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      await createTask(newTask);
    }

    onClose();
  };

  // Checklist Actions
  const handleAddCheckItem = () => {
    setChecklist((prev) => [
      ...prev,
      { id: generateId('chk'), text: '', completed: false },
    ]);
  };

  const handleToggleCheckItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleUpdateCheckItem = (id: string, text: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleRemoveCheckItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  // Delete note
  const handleDelete = async () => {
    if (taskToEdit) {
      await deleteTask(taskToEdit.id);
    }
    onClose();
  };

  // Promote note directly to today
  const handlePromoteToToday = async () => {
    if (taskToEdit) {
      await moveToToday(taskToEdit.id, selectedDate);
    }
    onClose();
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType={isMobile ? 'slide' : 'fade'}
      onRequestClose={handleSaveAndClose}
    >
      <View style={styles.backdrop}>
        {/* Dimmed backdrop click on desktop */}
        {!isMobile && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleSaveAndClose}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.modalCard,
            isMobile ? styles.modalCardMobile : styles.modalCardDesktop,
            {
              backgroundColor: cardStyle.backgroundColor,
              borderColor: cardStyle.borderColor,
            },
          ]}
        >
          {/* 1. Top Navigation Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSaveAndClose}
              style={styles.topIconBtn}
              accessibilityLabel="Back / Close"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={22} color={cardStyle.textColor} />
            </TouchableOpacity>

            <View style={styles.topBarRightActions}>
              {/* Pin button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPinned(!pinned)}
                style={styles.topIconBtn}
                accessibilityLabel={pinned ? 'Unpin note' : 'Pin note'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Pin
                  size={20}
                  color={pinned ? '#F59E0B' : cardStyle.subTextColor}
                  fill={pinned ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>

              {/* Move to today */}
              {taskToEdit && !taskToEdit.completed && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePromoteToToday}
                  style={styles.topIconBtn}
                  accessibilityLabel="Do today"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Zap size={20} color="#8B5CF6" />
                </TouchableOpacity>
              )}

              {/* Delete button */}
              {taskToEdit && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDelete}
                  style={styles.topIconBtn}
                  accessibilityLabel="Delete note"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={20} color={cardStyle.subTextColor} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 2. Note Body Canvas */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Clean Borderless Title */}
            <TextInput
              ref={titleInputRef}
              style={[
                styles.titleInput,
                { color: cardStyle.textColor },
              ]}
              placeholder="Title"
              placeholderTextColor={cardStyle.subTextColor}
              value={title}
              onChangeText={setTitle}
              multiline
              scrollEnabled={false}
              returnKeyType="next"
              onSubmitEditing={() => noteInputRef.current?.focus()}
            />

            {/* Checklist items */}
            {checklist.length > 0 && (
              <View style={styles.checklistSection}>
                {checklist.map((item) => (
                  <View key={item.id} style={styles.checklistItemRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleToggleCheckItem(item.id)}
                      style={styles.chkBoxBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {item.completed ? (
                        <CheckSquare size={18} color="#10B981" />
                      ) : (
                        <Square size={18} color={cardStyle.subTextColor} />
                      )}
                    </TouchableOpacity>

                    <TextInput
                      style={[
                        styles.checklistTextInput,
                        { color: cardStyle.textColor },
                        item.completed && styles.checklistTextInputDone,
                      ]}
                      placeholder="List item"
                      placeholderTextColor={cardStyle.subTextColor}
                      value={item.text}
                      onChangeText={(txt) => handleUpdateCheckItem(item.id, txt)}
                      multiline
                      scrollEnabled={false}
                    />

                    <TouchableOpacity
                      onPress={() => handleRemoveCheckItem(item.id)}
                      style={styles.chkRemoveBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={cardStyle.subTextColor} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* + Add List item */}
                <TouchableOpacity
                  onPress={handleAddCheckItem}
                  style={styles.addCheckItemRow}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={cardStyle.subTextColor} />
                  <Text style={[styles.addCheckItemText, { color: cardStyle.subTextColor }]}>
                    List item
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Note Body Text */}
            <Pressable
              onPress={() => noteInputRef.current?.focus()}
              style={styles.noteBodyPressable}
            >
              <TextInput
                ref={noteInputRef}
                style={[
                  styles.noteBodyInput,
                  { color: cardStyle.textColor },
                ]}
                placeholder="Note"
                placeholderTextColor={cardStyle.subTextColor}
                value={notes}
                onChangeText={setNotes}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </Pressable>
          </ScrollView>

          {/* 3. Horizontally Scrollable Options Bar: Priority & Schedule */}
          <View style={[styles.optionsBarWrapper, { borderTopColor: cardStyle.chipBorder }]}>
            <HorizontalScrollRow
              edgeToEdge={false}
              paddingHorizontal={14}
              gap={6}
            >
              {/* Priority Chips */}
              <Text style={[styles.sectionPillHeader, { color: cardStyle.subTextColor }]}>
                PRIORITY:
              </Text>
              {PRIORITY_OPTIONS.map((p) => {
                const active = priority === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPriority(p.id)}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: active ? p.activeBg : cardStyle.chipBg,
                        borderColor: active ? p.activeColor : cardStyle.chipBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        { color: active ? p.activeColor : cardStyle.textColor },
                        active && { fontWeight: '700' },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Subtle divider */}
              <View style={[styles.pillDivider, { backgroundColor: cardStyle.chipBorder }]} />

              {/* Schedule Chips */}
              <Text style={[styles.sectionPillHeader, { color: cardStyle.subTextColor }]}>
                WHEN:
              </Text>
              {scheduleOptions.map((opt) => {
                const active = scheduleSelection.id === opt.id && !showDatePickerInput;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => {
                      setScheduleSelection({
                        id: opt.id,
                        horizon: opt.horizon,
                        date: opt.date,
                        label: opt.label,
                      });
                      setShowDatePickerInput(false);
                    }}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: active
                          ? isDark
                            ? 'rgba(139, 92, 246, 0.3)'
                            : '#EDE9FE'
                          : cardStyle.chipBg,
                        borderColor: active ? '#8B5CF6' : cardStyle.chipBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        { color: active ? '#8B5CF6' : cardStyle.textColor },
                        active && { fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom Date Pill */}
              <TouchableOpacity
                onPress={() => setShowDatePickerInput(!showDatePickerInput)}
                style={[
                  styles.optionPill,
                  {
                    backgroundColor: showDatePickerInput || (scheduleSelection.id === 'custom')
                      ? isDark
                        ? 'rgba(139, 92, 246, 0.3)'
                        : '#EDE9FE'
                      : cardStyle.chipBg,
                    borderColor: showDatePickerInput || (scheduleSelection.id === 'custom')
                      ? '#8B5CF6'
                      : cardStyle.chipBorder,
                  },
                ]}
              >
                <CalendarIcon
                  size={12}
                  color={
                    showDatePickerInput || scheduleSelection.id === 'custom'
                      ? '#8B5CF6'
                      : cardStyle.subTextColor
                  }
                />
                <Text
                  style={[
                    styles.optionPillText,
                    {
                      color:
                        showDatePickerInput || scheduleSelection.id === 'custom'
                          ? '#8B5CF6'
                          : cardStyle.textColor,
                    },
                    (showDatePickerInput || scheduleSelection.id === 'custom') && { fontWeight: '700' },
                  ]}
                >
                  {customDate ? customDate : 'Date'}
                </Text>
              </TouchableOpacity>
            </HorizontalScrollRow>
          </View>

          {/* Optional inline date input when 'Date' is active */}
          {showDatePickerInput && (
            <View style={[styles.customDateRow, { borderTopColor: cardStyle.chipBorder }]}>
              <Text style={[styles.customDateLabel, { color: cardStyle.subTextColor }]}>
                Enter Date (YYYY-MM-DD):
              </Text>
              <TextInput
                style={[
                  styles.customDateInput,
                  {
                    color: cardStyle.textColor,
                    borderColor: cardStyle.chipBorder,
                    backgroundColor: cardStyle.chipBg,
                  },
                ]}
                placeholder={getTodayKey()}
                placeholderTextColor={cardStyle.subTextColor}
                value={customDate}
                onChangeText={(text) => {
                  setCustomDate(text);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
                    setScheduleSelection({
                      id: 'custom',
                      horizon: 'next_7_days',
                      date: text.trim(),
                      label: text.trim(),
                    });
                  }
                }}
              />
            </View>
          )}

          {/* Color Palette Swatches */}
          {showColorPicker && (
            <View style={[styles.trayWrapper, { borderTopColor: cardStyle.chipBorder }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorPaletteRow}
              >
                {KEEP_COLORS.map((c) => {
                  const active = color === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setColor(c.id)}
                      style={[
                        styles.paletteDot,
                        { backgroundColor: c.dotColor },
                        active && styles.paletteDotSelected,
                      ]}
                      accessibilityLabel={c.name}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 4. Bottom Toolbar */}
          <View
            style={[
              styles.bottomToolbar,
              isMobile ? styles.bottomToolbarMobile : styles.bottomToolbarDesktop,
              {
                borderTopColor: cardStyle.chipBorder,
                backgroundColor: cardStyle.backgroundColor,
              },
            ]}
          >
            <View style={styles.toolbarIconGroup}>
              {/* Color Palette Icon */}
              <TouchableOpacity
                onPress={() => setShowColorPicker(!showColorPicker)}
                style={styles.toolbarBtn}
                accessibilityLabel="Note color"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Palette size={20} color={cardStyle.subTextColor} />
              </TouchableOpacity>

              {/* Checklist Toggle */}
              <TouchableOpacity
                onPress={() => {
                  if (checklist.length === 0) {
                    handleAddCheckItem();
                  }
                }}
                style={styles.toolbarBtn}
                accessibilityLabel="Checklist"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CheckSquare size={20} color={cardStyle.subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Edited Time indicator + Close Button */}
            <View style={styles.toolbarRightGroup}>
              <Text
                style={[styles.editedTimeText, { color: cardStyle.subTextColor }]}
                numberOfLines={1}
              >
                {formatEditedTime(taskToEdit?.updatedAt)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSaveAndClose}
                style={[styles.closeBtn, { backgroundColor: cardStyle.chipBg }]}
              >
                <Text style={[styles.closeBtnText, { color: cardStyle.textColor }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export const FutureTaskFormModal: React.FC<FutureTaskFormModalProps> = ({
  visible,
  taskToEdit,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <FutureTaskNoteEditor
      key={taskToEdit ? taskToEdit.id : 'new-note'}
      taskToEdit={taskToEdit}
      onClose={onClose}
    />
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },
  modalCard: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 16,
  },
  modalCardDesktop: {
    width: '92%',
    maxWidth: 640,
    height: '88%',
    maxHeight: 760,
    borderRadius: 18,
    borderWidth: 1,
  },
  modalCardMobile: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 10,
  },
  topBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scrollable Content */
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.3,
    padding: 0,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        } as any)
      : {}),
  },
  noteBodyPressable: {
    flex: 1,
    minHeight: 200,
  },
  noteBodyInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 200,
    padding: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        } as any)
      : {}),
  },

  /* Checklist section */
  checklistSection: {
    marginBottom: 14,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  chkBoxBtn: {
    padding: 2,
  },
  checklistTextInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    padding: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        } as any)
      : {}),
  },
  checklistTextInputDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  chkRemoveBtn: {
    padding: 4,
  },
  addCheckItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginTop: 2,
  },
  addCheckItemText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Options Bar */
  optionsBarWrapper: {
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  sectionPillHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    alignSelf: 'center',
    marginRight: 2,
  },
  pillDivider: {
    width: 1,
    height: 18,
    alignSelf: 'center',
    marginHorizontal: 4,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Custom date row */
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  customDateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  customDateInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },

  /* Option Trays */
  trayWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  paletteDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  paletteDotSelected: {
    borderColor: '#8B5CF6',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },

  /* Bottom Toolbar */
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  bottomToolbarMobile: {
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
  },
  bottomToolbarDesktop: {
    paddingBottom: 12,
  },
  toolbarIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editedTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
