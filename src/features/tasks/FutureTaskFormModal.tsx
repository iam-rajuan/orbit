import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { Task, TaskPriority, TaskCategory, TaskHorizon } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDateStore } from '../../stores/useDateStore';
import { generateId } from '../../utils/id';
import { offsetDateKey, getTodayKey } from '../../utils/date';
import {
  Sparkles,
  Calendar,
  Clock,
  Tag,
  FileText,
  AlertCircle,
  Flag,
  Layers,
} from 'lucide-react-native';

interface FutureTaskFormModalProps {
  visible: boolean;
  taskToEdit?: Task | null;
  onClose: () => void;
}

const HEADING_PRESETS = [
  '🏗️ Core Architecture & Reliability',
  '🧠 Deep Learning & Skill Mastery',
  '💼 Career & Financial Planning',
  '🏡 Personal & Health Optimization',
  '⚡ Quick Wins (Free Time)',
  '🚀 Strategic Projects',
];

const HORIZON_OPTIONS: { id: TaskHorizon; label: string; desc: string }[] = [
  { id: 'next_7_days', label: '⚡ Next 7 Days', desc: 'Up ahead soon' },
  { id: 'this_month', label: '📅 This Month', desc: 'Later in month' },
  { id: 'someday', label: '💡 When I Have Time', desc: 'Someday / backlog' },
];

const EFFORT_OPTIONS = [
  { value: '15m', label: '⚡ 15m (Quick Win)' },
  { value: '30m', label: '🎯 30m (Focused)' },
  { value: '1h', label: '⏱️ 1h (Solid Block)' },
  { value: '2h+', label: '🔨 2h+ (Deep Work)' },
];

const CATEGORY_OPTIONS: TaskCategory[] = [
  'Office',
  'Study',
  'Finance',
  'Health',
  'Personal',
];

interface FormContentProps {
  taskToEdit?: Task | null;
  onClose: () => void;
}

const FutureTaskFormContent: React.FC<FormContentProps> = ({ taskToEdit, onClose }) => {
  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();
  const { createTask, updateTask } = useTaskStore();

  const [heading, setHeading] = useState(taskToEdit?.heading || HEADING_PRESETS[0]);
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || '');
  const [category, setCategory] = useState<TaskCategory>(taskToEdit?.category || 'Office');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'Medium');
  const [horizon, setHorizon] = useState<TaskHorizon>(taskToEdit?.horizon || 'next_7_days');
  const [estimatedTime, setEstimatedTime] = useState(taskToEdit?.estimatedTime || '30m');
  const [targetDate, setTargetDate] = useState(
    taskToEdit?.date && taskToEdit.date !== 'someday' ? taskToEdit.date : offsetDateKey(getTodayKey(), 3)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please provide a task title or summary.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const now = new Date().toISOString();
    const finalDate = horizon === 'someday' ? 'someday' : (targetDate.trim() || selectedDate);

    try {
      if (taskToEdit) {
        const updated: Task = {
          ...taskToEdit,
          heading: heading.trim() || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          category,
          priority,
          horizon,
          estimatedTime,
          date: finalDate,
          dueDate: finalDate !== 'someday' ? finalDate : undefined,
          isUpcoming: true,
          updatedAt: now,
        };
        await updateTask(updated);
      } else {
        const newTask: Task = {
          id: generateId('task'),
          heading: heading.trim() || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          category,
          type: 'Project',
          priority,
          horizon,
          estimatedTime,
          date: finalDate,
          dueDate: finalDate !== 'someday' ? finalDate : undefined,
          isUpcoming: true,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
        await createTask(newTask);
      }
      onClose();
    } catch {
      setError('Failed to save future task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconBadge}>
            <Sparkles size={18} color="#8B5CF6" />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {taskToEdit ? 'Edit Upcoming Task' : 'Add Future Task Ahead'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Plan ahead with headings, notes & time estimates — complete when you have time
            </Text>
          </View>
        </View>
      </View>

      {/* Error alert */}
      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={15} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 1. Task Heading / Workstream */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Layers size={13} color={theme.textSecondary} />
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Task Heading / Workstream
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
          placeholder="e.g. 🏗️ Core Architecture, 🧠 Deep Learning, ⚡ Quick Wins"
          placeholderTextColor={theme.textMuted}
          value={heading}
          onChangeText={setHeading}
        />
        {/* Quick Presets */}
        <View style={styles.chipRow}>
          {HEADING_PRESETS.map((p) => {
            const active = heading === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setHeading(p)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: active
                      ? isDark
                        ? 'rgba(139, 92, 246, 0.25)'
                        : '#EDE9FE'
                      : theme.surfaceSubtle,
                    borderColor: active ? '#8B5CF6' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: active ? '#8B5CF6' : theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Task Title */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Task Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.titleInput,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
          placeholder="What needs to be done? (action-oriented)"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* 3. Horizon / When to Complete */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Calendar size={13} color={theme.textSecondary} />
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Completion Horizon
          </Text>
        </View>
        <View style={styles.horizonSelector}>
          {HORIZON_OPTIONS.map((opt) => {
            const active = horizon === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setHorizon(opt.id)}
                style={[
                  styles.horizonBtn,
                  {
                    backgroundColor: active
                      ? isDark
                        ? 'rgba(139, 92, 246, 0.2)'
                        : '#EDE9FE'
                      : theme.surfaceSubtle,
                    borderColor: active ? '#8B5CF6' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.horizonBtnTitle,
                    { color: active ? '#8B5CF6' : theme.textPrimary },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={[styles.horizonBtnDesc, { color: theme.textMuted }]}>
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date presets if not someday */}
        {horizon !== 'someday' && (
          <View style={styles.quickDateRow}>
            {[
              { label: '+1 Day', days: 1 },
              { label: '+3 Days', days: 3 },
              { label: '+1 Week', days: 7 },
              { label: '+2 Weeks', days: 14 },
              { label: '+1 Month', days: 30 },
            ].map((d) => (
              <TouchableOpacity
                key={d.label}
                onPress={() => setTargetDate(offsetDateKey(getTodayKey(), d.days))}
                style={[
                  styles.quickDateBtn,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.quickDateText, { color: theme.textSecondary }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 4. Estimated Time & Priority Row */}
      <View style={styles.row}>
        {/* Estimated Effort */}
        <View style={styles.halfCol}>
          <View style={styles.labelRow}>
            <Clock size={13} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>Estimated Time</Text>
          </View>
          <View style={styles.effortGrid}>
            {EFFORT_OPTIONS.map((eff) => {
              const active = estimatedTime === eff.value;
              return (
                <TouchableOpacity
                  key={eff.value}
                  onPress={() => setEstimatedTime(eff.value)}
                  style={[
                    styles.effortBtn,
                    {
                      backgroundColor: active
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.2)'
                          : '#ECFDF5'
                        : theme.surfaceSubtle,
                      borderColor: active ? '#10B981' : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.effortBtnText,
                      { color: active ? '#059669' : theme.textSecondary },
                    ]}
                  >
                    {eff.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.halfCol}>
          <View style={styles.labelRow}>
            <Flag size={13} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>Priority Impact</Text>
          </View>
          <View style={styles.prioritySelector}>
            {(['High', 'Medium', 'Low'] as const).map((p) => {
              const active = priority === p;
              const color = p === 'High' ? '#F43F5E' : p === 'Medium' ? '#F59E0B' : '#64748B';
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor: active
                        ? isDark
                          ? `${color}25`
                          : `${color}15`
                        : theme.surfaceSubtle,
                      borderColor: active ? color : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.priorityBtnText, { color: active ? color : theme.textSecondary }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 5. Category Selection */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Tag size={13} color={theme.textSecondary} />
          <Text style={[styles.label, { color: theme.textPrimary }]}>Category</Text>
        </View>
        <View style={styles.categoryRow}>
          {CATEGORY_OPTIONS.map((c) => {
            const active = category === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active
                      ? isDark
                        ? 'rgba(139, 92, 246, 0.2)'
                        : '#EDE9FE'
                      : theme.surfaceSubtle,
                    borderColor: active ? '#8B5CF6' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: active ? '#8B5CF6' : theme.textSecondary },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. Summary / One-liner description */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Brief Description (optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
          placeholder="High-level goal or key deliverable"
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* 7. Detailed Notes, Bullet Steps & URLs */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <FileText size={13} color={theme.textSecondary} />
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Detailed Notes, Context & Steps (so you never forget)
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
          placeholder={'• Acceptance criteria or step-by-step checklist\n• Important links, docs or credentials\n• Ideas & why this matters'}
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.footerButtons}>
        <AppButton
          title="Cancel"
          variant="outline"
          size="md"
          onPress={onClose}
        />
        <AppButton
          title={taskToEdit ? 'Save Changes' : 'Add Upcoming Task'}
          variant="primary"
          size="md"
          loading={isSubmitting}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
};

export const FutureTaskFormModal: React.FC<FutureTaskFormModalProps> = ({
  visible,
  taskToEdit,
  onClose,
}) => {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title=""
      maxWidth={580}
    >
      {visible ? (
        <FutureTaskFormContent
          key={taskToEdit ? taskToEdit.id : 'new-future-task'}
          taskToEdit={taskToEdit}
          onClose={onClose}
        />
      ) : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    maxHeight: 580,
  },
  header: {
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  titleInput: {
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 85,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  horizonSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  horizonBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  horizonBtnTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  horizonBtnDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  quickDateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  effortGrid: {
    gap: 6,
  },
  effortBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  effortBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  prioritySelector: {
    gap: 6,
  },
  priorityBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
});
