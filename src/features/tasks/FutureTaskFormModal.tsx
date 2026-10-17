import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

const FutureTaskNoteEditor: React.FC<{
  taskToEdit?: Task | null;
  onClose: () => void;
}> = ({ taskToEdit, onClose }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { selectedDate } = useDateStore();
  const { createTask, updateTask, deleteTask, moveToToday } = useTaskStore();

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

  const cardStyle = getKeepCardStyle(color, isDark, theme.surface, theme.border);

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
      <TouchableWithoutFeedback onPress={handleSaveAndClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
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
                >
                  <ArrowLeft size={20} color={cardStyle.textColor} />
                </TouchableOpacity>

                <View style={styles.topBarRightActions}>
                  {/* Pin button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setPinned(!pinned)}
                    style={styles.topIconBtn}
                    accessibilityLabel={pinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin
                      size={18}
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
                    >
                      <Zap size={18} color="#8B5CF6" />
                    </TouchableOpacity>
                  )}

                  {/* Delete button */}
                  {taskToEdit && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleDelete}
                      style={styles.topIconBtn}
                      accessibilityLabel="Delete note"
                    >
                      <Trash2 size={18} color={cardStyle.subTextColor} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 2. Note Body: Title + Checklist or Text Note */}
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentScrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Clean Borderless Title */}
                <TextInput
                  style={[
                    styles.titleInput,
                    { color: cardStyle.textColor },
                  ]}
                  placeholder="Title"
                  placeholderTextColor={cardStyle.subTextColor}
                  value={title}
                  onChangeText={setTitle}
                  multiline
                />

                {/* Checklist items (if any exist or added) */}
                {checklist.length > 0 && (
                  <View style={styles.checklistSection}>
                    {checklist.map((item) => (
                      <View key={item.id} style={styles.checklistItemRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleToggleCheckItem(item.id)}
                          style={styles.chkBoxBtn}
                        >
                          {item.completed ? (
                            <CheckSquare size={16} color="#10B981" />
                          ) : (
                            <Square size={16} color={cardStyle.subTextColor} />
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
                        />

                        <TouchableOpacity
                          onPress={() => handleRemoveCheckItem(item.id)}
                          style={styles.chkRemoveBtn}
                        >
                          <X size={14} color={cardStyle.subTextColor} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* + Add List item */}
                    <TouchableOpacity
                      onPress={handleAddCheckItem}
                      style={styles.addCheckItemRow}
                    >
                      <Plus size={16} color={cardStyle.subTextColor} />
                      <Text style={[styles.addCheckItemText, { color: cardStyle.subTextColor }]}>
                        List item
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Clean Borderless Multiline Note */}
                <TextInput
                  style={[
                    styles.noteBodyInput,
                    { color: cardStyle.textColor },
                  ]}
                  placeholder="Note"
                  placeholderTextColor={cardStyle.subTextColor}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />

                {/* Chips Area: Workstream tag, Reminder, Effort badge */}
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
                      <Tag size={11} color={cardStyle.subTextColor} />
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
                    <Bell size={11} color={cardStyle.subTextColor} />
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
                      <Clock size={11} color={cardStyle.subTextColor} />
                      <Text
                        style={[styles.keepChipText, { color: cardStyle.textColor }]}
                        numberOfLines={1}
                      >
                        {estimatedTime}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </ScrollView>
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
                  { borderTopColor: 'rgba(150, 150, 150, 0.15)' },
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
                  >
                    <Palette size={18} color={cardStyle.subTextColor} />
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
                  >
                    <Bell size={18} color={cardStyle.subTextColor} />
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
                  >
                    <Tag size={18} color={cardStyle.subTextColor} />
                  </TouchableOpacity>

                  {/* Add Checklist Icon */}
                  <TouchableOpacity
                    onPress={() => {
                      if (checklist.length === 0) {
                        handleAddCheckItem();
                      } else {
                        handleAddCheckItem();
                      }
                    }}
                    style={styles.toolbarBtn}
                    accessibilityLabel="Checklist"
                  >
                    <CheckSquare size={18} color={cardStyle.subTextColor} />
                  </TouchableOpacity>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSaveAndClose}
                  style={styles.closeBtn}
                >
                  <Text style={[styles.closeBtnText, { color: cardStyle.textColor }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
  },
  modalCardDesktop: {
    width: '92%',
    maxWidth: 600,
    maxHeight: '85%',
    borderRadius: 16,
  },
  modalCardMobile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scrollable Content */
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    padding: 0,
    marginBottom: 14,
  },
  noteBodyInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 140,
    padding: 0,
    marginBottom: 16,
  },

  /* Checklist section */
  checklistSection: {
    marginBottom: 14,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  chkBoxBtn: {
    padding: 2,
  },
  checklistTextInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
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
    fontSize: 13,
    fontWeight: '500',
  },

  /* Chips Row */
  chipsScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  keepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  keepChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Option Trays */
  trayWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  trayScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  trayPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paletteDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  toolbarIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
