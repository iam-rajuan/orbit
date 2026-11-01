import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { CornerUpRight, RotateCcw, Calendar, Plus } from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { Task, TaskPriority } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDateStore } from '../../stores/useDateStore';
import { useTheme } from '../../theme/ThemeContext';
import { generateId } from '../../utils/id';
import { ForwardBadge } from './ForwardBadge';
import { offsetDateKey, formatAdaptiveDate } from '../../utils/date';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

const TaskFormContent: React.FC<{
  taskToEdit?: Task | null;
  onClose: () => void;
}> = ({ taskToEdit, onClose }) => {
  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();
  const { createTask, updateTask } = useTaskStore();
  const { settings } = useSettingsStore();

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [category, setCategory] = useState(taskToEdit?.category || settings.taskCategories[0] || 'Office');
  const [type, setType] = useState(taskToEdit?.type || settings.taskTypes[0] || 'Project');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'Medium');
  const [projectName, setProjectName] = useState(taskToEdit?.projectName || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || '');
  const [taskDate, setTaskDate] = useState(taskToEdit?.date || selectedDate);
  const [forwardCount, setForwardCount] = useState(taskToEdit?.forwardCount || 0);
  const [originalDate, setOriginalDate] = useState(taskToEdit?.originalDate || taskToEdit?.date);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!title.trim()) {
      setError('Title or task summary is required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleForwardToTomorrow = () => {
    const nextDate = offsetDateKey(taskDate === 'someday' ? new Date().toISOString().slice(0, 10) : taskDate, 1);
    setTaskDate(nextDate);
    setForwardCount((prev) => prev + 1);
    if (!originalDate) {
      setOriginalDate(taskDate);
    }
  };

  const handleResetForwardCount = () => {
    setForwardCount(0);
    setOriginalDate(undefined);
  };

  // Smart Bullet List Handler:
  // - Starts typing on empty field -> auto adds "• "
  // - User presses Enter -> creates next line with "• "
  // - User presses Enter on an empty bullet ("• " or "•") -> cleanly exits bullet list
  // - Pasting multiline text -> bullets every line
  const handleDescriptionChange = (next: string) => {
    const prev = description;

    // 1. If deleting down to solitary bullet or empty, reset completely
    if ((next === '• ' || next === '•' || next === '') && prev.length > next.length) {
      setDescription('');
      return;
    }

    // 2. If first character entered on empty text, prefix with bullet
    if (prev === '' && next.length > 0 && !next.startsWith('•')) {
      setDescription('• ' + next);
      return;
    }

    // 3. User pasted multiline text
    if (next.length - prev.length > 4 && next.includes('\n')) {
      const formatted = next.split('\n').map((line) => {
        const trimmed = line.trim();
        if (trimmed.length > 0 && !trimmed.startsWith('•')) {
          return '• ' + trimmed;
        }
        return line;
      });
      setDescription(formatted.join('\n'));
      return;
    }

    // 4. User pressed Enter (newline added)
    if (next.length > prev.length && next.includes('\n')) {
      const prevLines = prev.split('\n');
      const nextLines = next.split('\n');

      if (nextLines.length > prevLines.length) {
        let splitIdx = nextLines.findIndex((line, i) => i < prevLines.length && line !== prevLines[i]);
        if (splitIdx === -1) {
          splitIdx = nextLines.length - 2;
        }

        const lineBeforeNewline = nextLines[splitIdx];
        // If user pressed enter on an empty bullet line -> exit bullet mode!
        if (lineBeforeNewline && (lineBeforeNewline.trim() === '•' || lineBeforeNewline.trim() === '')) {
          nextLines[splitIdx] = '';
          setDescription(nextLines.join('\n'));
          return;
        }

        // Add bullet to the newly started line if it doesn't already have one
        const newLineIdx = splitIdx + 1;
        if (newLineIdx < nextLines.length && !nextLines[newLineIdx].startsWith('•')) {
          nextLines[newLineIdx] = '• ' + nextLines[newLineIdx];
          setDescription(nextLines.join('\n'));
          return;
        }
      }
    }

    setDescription(next);
  };

  const handleAddBullet = () => {
    if (!description.trim()) {
      setDescription('• ');
    } else if (description.endsWith('\n')) {
      setDescription(description + '• ');
    } else {
      setDescription(description + '\n• ');
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    const now = new Date().toISOString();

    if (taskToEdit) {
      const updated: Task = {
        ...taskToEdit,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        type,
        priority,
        projectName: projectName.trim() || undefined,
        notes: notes.trim() || undefined,
        date: taskDate,
        forwardCount: forwardCount > 0 ? forwardCount : undefined,
        originalDate: forwardCount > 0 ? originalDate : undefined,
        updatedAt: now,
      };
      await updateTask(updated);
    } else {
      const newTask: Task = {
        id: generateId('task'),
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        type,
        priority,
        projectName: projectName.trim() || undefined,
        notes: notes.trim() || undefined,
        date: taskDate || selectedDate,
        forwardCount: forwardCount > 0 ? forwardCount : undefined,
        originalDate: forwardCount > 0 ? originalDate : undefined,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      await createTask(newTask);
    }

    onClose();
  };

  const categoryOptions = settings.taskCategories.map((c) => ({ label: c, value: c }));
  const typeOptions = settings.taskTypes.map((t) => ({ label: t, value: t }));
  const priorityOptions = [
    { label: 'High Priority', value: 'High' },
    { label: 'Medium Priority', value: 'Medium' },
    { label: 'Low Priority', value: 'Low' },
  ];

  return (
    <View style={styles.formContainer}>
      {/* 1. Title Field */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TASK TITLE</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <TextInput
          placeholder="e.g. Debug token expiration issue"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={(txt) => {
            setTitle(txt);
            if (error) setError(null);
          }}
          style={[
            styles.inputBox,
            styles.titleInput,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
              borderColor: error ? theme.danger : theme.border,
              color: theme.textPrimary,
            },
          ]}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* 2. Category & Type Selects */}
      <View style={styles.row}>
        <View style={styles.col}>
          <AppSelect
            label="Category"
            value={category}
            options={categoryOptions}
            onSelect={setCategory}
          />
        </View>
        <View style={styles.col}>
          <AppSelect
            label="Type"
            value={type}
            options={typeOptions}
            onSelect={setType}
          />
        </View>
      </View>

      {/* 3. Priority Select & Project Name */}
      <View style={styles.row}>
        <View style={styles.col}>
          <AppSelect
            label="Priority"
            value={priority}
            options={priorityOptions}
            onSelect={(val) => setPriority(val as TaskPriority)}
          />
        </View>
        <View style={styles.col}>
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PROJECT / LIST</Text>
            </View>
            <TextInput
              placeholder="e.g. Client A, Thesis"
              placeholderTextColor={theme.textMuted}
              value={projectName}
              onChangeText={setProjectName}
              style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 4. Detailed Description with Smart Bullets */}
      <View style={styles.formGroup}>
        <View style={styles.labelWithActionRow}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DETAILED DESCRIPTION</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddBullet}
            style={[
              styles.bulletActionBtn,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
              },
            ]}
          >
            <Plus size={12} color="#4F46E5" strokeWidth={2.6} />
            <Text style={styles.bulletActionText}>Bullet</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder={'• Tap to write notes...\n• Press Enter for next bullet'}
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={handleDescriptionChange}
          multiline
          scrollEnabled={false}
          numberOfLines={4}
          textAlignVertical="top"
          style={[
            styles.inputBox,
            styles.textAreaInput,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
        />
      </View>

      {/* 5. Quick Notes */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>NOTES / CONTEXT</Text>
        </View>
        <TextInput
          placeholder="e.g. Testing needed, Stakeholder alignment"
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          style={[
            styles.inputBox,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
        />
      </View>

      {/* 6. Scheduled Date & Deferral Controls */}
      <View
        style={[
          styles.deferralCard,
          {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#F5F3FF',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.22)' : '#DDD6FE',
          },
        ]}
      >
        <View style={styles.deferralTopRow}>
          <View style={styles.deferralDateInfo}>
            <View style={styles.calendarIconCircle}>
              <Calendar size={14} color="#7C3AED" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={[styles.deferralSubLabel, { color: theme.textMuted }]}>SCHEDULED DATE</Text>
              <Text style={[styles.deferralDateText, { color: theme.textPrimary }]}>
                {formatAdaptiveDate(taskDate, 'medium')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleForwardToTomorrow}
            style={[styles.forwardTomorrowBtn, { backgroundColor: theme.primary }]}
            accessibilityLabel="Forward to tomorrow"
          >
            <CornerUpRight size={13} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.forwardTomorrowText}>+1 Day</Text>
          </TouchableOpacity>
        </View>

        {forwardCount > 0 ? (
          <View style={styles.deferralHistoryRow}>
            <ForwardBadge
              count={forwardCount}
              originalDate={originalDate}
              size="md"
              showOriginalDate={true}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetForwardCount}
              style={styles.resetCountBtn}
            >
              <RotateCcw size={11} color={theme.textMuted} />
              <Text style={[styles.resetCountText, { color: theme.textMuted }]}>Reset Count</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* 7. Action Buttons */}
      <View style={styles.buttonRow}>
        <AppButton
          title="Cancel"
          variant="outline"
          onPress={onClose}
          style={styles.btn}
        />
        <AppButton
          title={taskToEdit ? 'Save Changes' : 'Create Task'}
          variant="primary"
          onPress={handleSave}
          style={styles.btn}
        />
      </View>
    </View>
  );
};

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  taskToEdit,
}) => {
  const { selectedDate } = useDateStore();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Add New Task'}
      subtitle={`For date: ${selectedDate}`}
    >
      {visible ? (
        <TaskFormContent
          key={taskToEdit ? taskToEdit.id : 'new-today-task'}
          taskToEdit={taskToEdit}
          onClose={onClose}
        />
      ) : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingVertical: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  requiredMark: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  bulletActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  bulletActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  inputBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 44,
    outlineStyle: 'none' as any,
  },
  titleInput: {
    fontSize: 14,
    fontWeight: '600',
    minHeight: 46,
  },
  textAreaInput: {
    minHeight: 90,
    lineHeight: 20,
    paddingTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  btn: {
    minWidth: 110,
  },
  deferralCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  deferralTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  deferralDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deferralSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  deferralDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  forwardTomorrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  forwardTomorrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deferralHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  resetCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  resetCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
