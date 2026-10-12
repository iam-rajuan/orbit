import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { RoutineItem } from '../../types';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { generateId } from '../../utils/id';

interface RoutineFormModalProps {
  visible: boolean;
  onClose: () => void;
  routineToEdit?: RoutineItem | null;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', day: 0 },
  { label: 'Mon', day: 1 },
  { label: 'Tue', day: 2 },
  { label: 'Wed', day: 3 },
  { label: 'Thu', day: 4 },
  { label: 'Fri', day: 5 },
  { label: 'Sat', day: 6 },
];

export const RoutineFormModal: React.FC<RoutineFormModalProps> = ({
  visible,
  onClose,
  routineToEdit,
}) => {
  const { routines, createRoutine, updateRoutine } = useRoutineStore();

  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (routineToEdit) {
      setTime(routineToEdit.time);
      setTitle(routineToEdit.title);
      setDescription(routineToEdit.description || '');
      setRepeatDays(routineToEdit.repeatDays || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setTime('8:00 AM');
      setTitle('');
      setDescription('');
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    }
    setErrors({});
  }, [routineToEdit, visible]);

  const toggleDay = (day: number) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day].sort());
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!time.trim()) errs.time = 'Time is required (e.g. 5:30 PM)';
    if (!title.trim()) errs.title = 'Routine activity name is required';
    if (repeatDays.length === 0) errs.days = 'Select at least one day';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    if (routineToEdit) {
      const updated: RoutineItem = {
        ...routineToEdit,
        time: time.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        repeatDays,
      };
      await updateRoutine(updated);
    } else {
      const newRoutine: RoutineItem = {
        id: generateId('routine'),
        time: time.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        repeatDays,
        enabled: true,
        order: routines.length + 1,
      };
      await createRoutine(newRoutine);
    }

    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={routineToEdit ? 'Edit Routine Habit' : 'Add Routine Habit'}
      subtitle="Fixed daily schedule item"
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppInput
            label="Time (e.g. 3:30 AM, 5:30 PM) *"
            placeholder="8:00 AM"
            value={time}
            onChangeText={setTime}
            error={errors.time}
          />
        </View>
        <View style={{ flex: 2 }}>
          <AppInput
            label="Activity Title *"
            placeholder="e.g. Gym, Office, Chickpeas"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
        </View>
      </View>

      <AppInput
        label="Description / Note"
        placeholder="e.g. Strength training, Healthy snacks"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.daysContainer}>
        <Text style={styles.daysLabel}>Repeat Days</Text>
        <View style={styles.daysRow}>
          {DAYS_OF_WEEK.map((item) => {
            const active = repeatDays.includes(item.day);
            return (
              <TouchableOpacity
                key={item.day}
                activeOpacity={0.7}
                onPress={() => toggleDay(item.day)}
                style={[styles.dayPill, active && styles.dayPillActive]}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.days ? <Text style={styles.errText}>{errors.days}</Text> : null}
      </View>

      <View style={styles.buttonRow}>
        <AppButton
          title="Cancel"
          variant="outline"
          onPress={onClose}
          style={styles.btn}
        />
        <AppButton
          title={routineToEdit ? 'Save Habit' : 'Create Habit'}
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
  daysContainer: {
    marginBottom: 16,
  },
  daysLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  dayPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  dayTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errText: {
    fontSize: 12,
    color: '#F43F5E',
    marginTop: 4,
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
