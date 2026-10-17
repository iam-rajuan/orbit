import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { Task, TaskPriority } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDateStore } from '../../stores/useDateStore';
import { useTheme } from '../../theme/ThemeContext';
import { generateId } from '../../utils/id';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

const TaskFormContent: React.FC<{
  taskToEdit?: Task | null;
  onClose: () => void;
}> = ({ taskToEdit, onClose }) => {
  const { theme } = useTheme();
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
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!title.trim()) {
      setError('Title or task summary is required');
      return false;
    }
    setError(null);
    return true;
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
        date: selectedDate,
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
});
