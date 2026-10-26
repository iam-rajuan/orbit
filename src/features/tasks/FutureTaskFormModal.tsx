import React, { useState, useRef } from 'react';
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
import { Task, TaskHorizon } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDateStore } from '../../stores/useDateStore';
import { generateId } from '../../utils/id';
import {
  ArrowLeft,
  Pin,
  Trash2,
  Zap,
  Palette,
  Bell,
  Tag,
  CheckSquare,
  Square,
  Plus,
  X,
  Clock,
} from 'lucide-react-native';
import { KEEP_COLORS, getKeepCardStyle } from './keepTheme';

interface FutureTaskFormModalProps {
  visible: boolean;
  taskToEdit?: Task | null;
  onClose: () => void;
}

const QUICK_LABELS = [
  'Architecture',
  'Deep Learning',
  'Finance',
  'Health',
  'Quick Wins',
  'Projects',
];

const HORIZON_OPTIONS: { id: TaskHorizon; label: string }[] = [
  { id: 'next_7_days', label: '⚡ Next 7 Days' },
  { id: 'this_month', label: '📅 This Month' },
  { id: 'someday', label: '💡 Someday' },
];

const EFFORT_OPTIONS = ['15m', '30m', '1h', '2h+'];

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
  const { isDark, theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { selectedDate } = useDateStore();
  const { createTask, updateTask, deleteTask, moveToToday } = useTaskStore();

  const titleInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  // Note State directly initialized
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || taskToEdit?.description || '');
  const [heading, setHeading] = useState(taskToEdit?.heading || QUICK_LABELS[0]);
  const [horizon, setHorizon] = useState<TaskHorizon>(taskToEdit?.horizon || 'next_7_days');
  const [estimatedTime, setEstimatedTime] = useState(taskToEdit?.estimatedTime || '30m');
  const [color, setColor] = useState(taskToEdit?.color || 'default');
  const [pinned, setPinned] = useState(taskToEdit?.pinned || false);
  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>(
    taskToEdit?.checklist || []
  );

  // Tray Toggles
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showHorizonPicker, setShowHorizonPicker] = useState(false);

  // Always solid opaque background for note editing to guarantee zero bleed-through
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
    const finalDate = horizon === 'someday' ? 'someday' : (taskToEdit?.date || selectedDate);

    if (taskToEdit) {
      const updated: Task = {
        ...taskToEdit,
        title: finalTitle || 'Untitled note',
        notes: finalNotes || undefined,
        description: finalNotes || undefined,
        heading,
        horizon,
        estimatedTime,
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
        heading,
        category: 'Office',
        type: 'Project',
        priority: 'Medium',
        horizon,
        estimatedTime,
        date: finalDate,
        dueDate: finalDate !== 'someday' ? finalDate : undefined,
        isUpcoming: true,
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

  // Cycle effort
  const handleCycleEffort = () => {
    const currentIdx = EFFORT_OPTIONS.indexOf(estimatedTime);
    const nextIdx = (currentIdx + 1) % EFFORT_OPTIONS.length;
    setEstimatedTime(EFFORT_OPTIONS[nextIdx]);
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
          {/* 1. Google Keep Top Navigation Bar */}
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

              {/* Move to today (Orbit Zap) */}
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

          {/* 2. Note Body: Google Keep Fluid Scrolling Canvas */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Clean Borderless Auto-Expanding Title (scrollEnabled=false delegates scrolling to parent) */}
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

            {/* Checklist items (Google Keep style) */}
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

            {/* Note Body Area (scrollEnabled=false + tap anywhere to focus) */}
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

            {/* Chips Area: Workstream tag, Reminder, Effort badge */}
            <View style={styles.chipsSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollRow}
              >
                {/* Workstream / Label Chip */}
                {heading ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowLabelPicker(!showLabelPicker);
                      setShowColorPicker(false);
                      setShowHorizonPicker(false);
                    }}
                    style={[
                      styles.keepChip,
                      {
                        backgroundColor: cardStyle.chipBg,
                        borderColor: cardStyle.chipBorder,
                      },
                    ]}
                  >
                    <Tag size={12} color={cardStyle.subTextColor} />
                    <Text
                      style={[styles.keepChipText, { color: cardStyle.textColor }]}
                      numberOfLines={1}
                    >
                      {heading}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Horizon / Reminder Chip */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowHorizonPicker(!showHorizonPicker);
                    setShowColorPicker(false);
                    setShowLabelPicker(false);
                  }}
                  style={[
                    styles.keepChip,
                    {
                      backgroundColor: cardStyle.chipBg,
                      borderColor: cardStyle.chipBorder,
                    },
                  ]}
                >
                  <Bell size={12} color={cardStyle.subTextColor} />
                  <Text
                    style={[styles.keepChipText, { color: cardStyle.textColor }]}
                    numberOfLines={1}
                  >
                    {horizon === 'next_7_days'
                      ? 'Next 7 Days'
                      : horizon === 'this_month'
                      ? 'This Month'
                      : 'Someday'}
                  </Text>
                </TouchableOpacity>

                {/* Effort Chip */}
                {estimatedTime ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCycleEffort}
                    style={[
                      styles.keepChip,
                      {
                        backgroundColor: cardStyle.chipBg,
                        borderColor: cardStyle.chipBorder,
                      },
                    ]}
                  >
                    <Clock size={12} color={cardStyle.subTextColor} />
                    <Text
                      style={[styles.keepChipText, { color: cardStyle.textColor }]}
                      numberOfLines={1}
                    >
                      {estimatedTime}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </View>
          </ScrollView>

          {/* 3. Collapsible Option Trays */}
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

          {/* Label Selector Tray */}
          {showLabelPicker && (
            <View style={[styles.trayWrapper, { borderTopColor: cardStyle.chipBorder }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trayScrollRow}
              >
                {QUICK_LABELS.map((lbl) => {
                  const active = heading === lbl;
                  return (
                    <TouchableOpacity
                      key={lbl}
                      onPress={() => {
                        setHeading(lbl);
                        setShowLabelPicker(false);
                      }}
                      style={[
                        styles.trayPill,
                        active && {
                          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#EDE9FE',
                          borderColor: '#8B5CF6',
                        },
                        !active && {
                          backgroundColor: cardStyle.chipBg,
                          borderColor: cardStyle.chipBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.trayPillText,
                          { color: active ? '#8B5CF6' : cardStyle.textColor },
                        ]}
                      >
                        {lbl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Horizon Selector Tray */}
          {showHorizonPicker && (
            <View style={[styles.trayWrapper, { borderTopColor: cardStyle.chipBorder }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trayScrollRow}
              >
                {HORIZON_OPTIONS.map((opt) => {
                  const active = horizon === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        setHorizon(opt.id);
                        setShowHorizonPicker(false);
                      }}
                      style={[
                        styles.trayPill,
                        active && {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                        !active && {
                          backgroundColor: cardStyle.chipBg,
                          borderColor: cardStyle.chipBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.trayPillText,
                          { color: active ? '#FFFFFF' : cardStyle.textColor },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 4. Google Keep Bottom Toolbar */}
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
                onPress={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowLabelPicker(false);
                  setShowHorizonPicker(false);
                }}
                style={styles.toolbarBtn}
                accessibilityLabel="Note color"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Palette size={20} color={cardStyle.subTextColor} />
              </TouchableOpacity>

              {/* Reminder / Horizon Icon */}
              <TouchableOpacity
                onPress={() => {
                  setShowHorizonPicker(!showHorizonPicker);
                  setShowColorPicker(false);
                  setShowLabelPicker(false);
                }}
                style={styles.toolbarBtn}
                accessibilityLabel="Completion horizon"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Bell size={20} color={cardStyle.subTextColor} />
              </TouchableOpacity>

              {/* Workstream / Label Icon */}
              <TouchableOpacity
                onPress={() => {
                  setShowLabelPicker(!showLabelPicker);
                  setShowColorPicker(false);
                  setShowHorizonPicker(false);
                }}
                style={styles.toolbarBtn}
                accessibilityLabel="Workstream label"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Tag size={20} color={cardStyle.subTextColor} />
              </TouchableOpacity>

              {/* Add Checklist Icon */}
              <TouchableOpacity
                onPress={() => {
                  handleAddCheckItem();
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
    paddingBottom: 32,
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
    minHeight: 220,
  },
  noteBodyInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 220,
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

  /* Chips Row */
  chipsSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  chipsScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  keepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  keepChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Option Trays */
  trayWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  trayScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trayPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  trayPillText: {
    fontSize: 13,
    fontWeight: '600',
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
