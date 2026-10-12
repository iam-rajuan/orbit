import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppInput } from '../../components/ui/AppInput';
import { AppTextarea } from '../../components/ui/AppTextarea';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { Task, TaskPriority } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDateStore } from '../../stores/useDateStore';
import { generateId } from '../../utils/id';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  taskToEdit,
}) => {
  const { selectedDate } = useDateStore();
  const { createTask, updateTask } = useTaskStore();
  const { settings } = useSettingsStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Office');
  const [type, setType] = useState('Project');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      setType(taskToEdit.type);
      setPriority(taskToEdit.priority);
      setProjectName(taskToEdit.projectName || '');
      setNotes(taskToEdit.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(settings.taskCategories[0] || 'Office');
      setType(settings.taskTypes[0] || 'Project');
      setPriority('Medium');
      setProjectName('');
      setNotes('');
    }
    setErrors({});
  }, [taskToEdit, visible]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Title or task summary is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    <AppModal
      visible={visible}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Add New Task'}
      subtitle={`For date: ${selectedDate}`}
    >
      <AppInput
        label="Task Summary / Title *"
        placeholder="e.g. Debug token expiration issue"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />

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
          <AppInput
            label="Project / List"
            placeholder="e.g. Client A, Thesis, Home"
            value={projectName}
            onChangeText={setProjectName}
          />
        </View>
      </View>

      <AppTextarea
        label="Detailed Description"
        placeholder="• Bullet points or extended notes..."
        value={description}
        onChangeText={setDescription}
        numberOfLines={3}
      />

      <AppInput
        label="Notes"
        placeholder="e.g. Testing needed, Stakeholder alignment"
        value={notes}
        onChangeText={setNotes}
      />

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
    </AppModal>
  );
};

const styles = StyleSheet.create({
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
