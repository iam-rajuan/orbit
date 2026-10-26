import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { CornerUpRight, RotateCcw, Calendar } from 'lucide-react-native';
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
      {/* Title Field (Borderless!) */}
      <View style={styles.formGroup}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          Task Summary / Title <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          placeholder="e.g. Debug token expiration issue"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={(txt) => {
            setTitle(txt);
            if (error) setError(null);
          }}
          style={[
            styles.borderlessInput,
            styles.titleInput,
            {
              backgroundColor: theme.surfaceSubtle,
              color: theme.textPrimary,
            },
          ]}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* Category & Type Selects */}
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

      {/* Priority Select & Project Name (Borderless input!) */}
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
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Project / List</Text>
            <TextInput
              placeholder="e.g. Client A, Thesis"
              placeholderTextColor={theme.textMuted}
              value={projectName}
              onChangeText={setProjectName}
              style={[
                styles.borderlessInput,
                {
                  backgroundColor: theme.surfaceSubtle,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Detailed Description (Borderless textarea!) */}
      <View style={styles.formGroup}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Detailed Description</Text>
        <TextInput
          placeholder="• Bullet points or extended notes..."
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={[
            styles.borderlessInput,
            styles.textAreaInput,
            {
              backgroundColor: theme.surfaceSubtle,
              color: theme.textPrimary,
            },
          ]}
        />
      </View>

      {/* Notes Field (Borderless!) */}
      <View style={styles.formGroup}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes</Text>
        <TextInput
          placeholder="e.g. Testing needed, Stakeholder alignment"
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          style={[
            styles.borderlessInput,
            {
              backgroundColor: theme.surfaceSubtle,
              color: theme.textPrimary,
            },
          ]}
        />
      </View>

      {/* Date & Forwarding Controls */}
      <View
        style={[
          styles.deferralCard,
          {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#F5F3FF',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#DDD6FE',
          },
        ]}
      >
        <View style={styles.deferralTopRow}>
          <View style={styles.deferralDateInfo}>
            <Calendar size={14} color="#8B5CF6" />
            <Text style={[styles.deferralDateLabel, { color: theme.textSecondary }]}>
              Scheduled Date: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{formatAdaptiveDate(taskDate, 'medium')}</Text>
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleForwardToTomorrow}
            style={[styles.forwardTomorrowBtn, { backgroundColor: theme.primary }]}
            accessibilityLabel="Forward to tomorrow"
          >
            <CornerUpRight size={14} color="#FFFFFF" strokeWidth={2.4} />
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

      {/* Footer Buttons */}
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  borderlessInput: {
    borderWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  titleInput: {
    fontSize: 14,
    fontWeight: '600',
  },
  textAreaInput: {
    minHeight: 75,
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
    marginTop: 16,
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
    flexWrap: 'wrap',
  },
  deferralDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deferralDateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  forwardTomorrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
