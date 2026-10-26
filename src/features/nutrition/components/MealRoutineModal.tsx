import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppModal } from '../../../components/ui/AppModal';
import { MealSlot } from '../../../types/nutrition';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { SortableList } from '../../../components/ui/SortableList';
import {
  Plus,
  Trash2,
  Clock,
  Check,
} from 'lucide-react-native';

interface MealRoutineModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MealRoutineModal: React.FC<MealRoutineModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { mealSlots, addMealSlot, deleteMealSlot, reorderMealSlots } = useNutritionStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('04:00 PM');
  const [newSlotCalories, setNewSlotCalories] = useState('300');

  const handleAddNewSlot = async () => {
    if (!newSlotName.trim()) return;

    await addMealSlot({
      name: newSlotName.trim(),
      time: newSlotTime.trim() || '12:00 PM',
      targetCalories: parseInt(newSlotCalories, 10) || 300,
      enabled: true,
      iconName: 'UtensilsCrossed',
    });

    setNewSlotName('');
    setIsAddingNew(false);
  };

  const handleApplyPreset = async (presetName: '3meals' | '4meals' | '5meals' | 'fasting') => {
    let presetSlots: Omit<MealSlot, 'id' | 'order'>[] = [];

    switch (presetName) {
      case '3meals':
        presetSlots = [
          { name: 'Breakfast', time: '08:00 AM', targetCalories: 600, enabled: true, iconName: 'Sunrise' },
          { name: 'Lunch', time: '01:30 PM', targetCalories: 850, enabled: true, iconName: 'Sun' },
          { name: 'Dinner', time: '08:30 PM', targetCalories: 650, enabled: true, iconName: 'Moon' },
        ];
        break;
      case '4meals':
        presetSlots = [
          { name: 'Breakfast', time: '08:00 AM', targetCalories: 480, enabled: true, iconName: 'Sunrise' },
          { name: 'Lunch', time: '01:30 PM', targetCalories: 680, enabled: true, iconName: 'Sun' },
          { name: 'Habit Snack & Tea', time: '05:00 PM', targetCalories: 340, enabled: true, iconName: 'Coffee' },
          { name: 'Dinner', time: '08:30 PM', targetCalories: 600, enabled: true, iconName: 'Moon' },
        ];
        break;
      case '5meals':
        presetSlots = [
          { name: 'Breakfast', time: '07:30 AM', targetCalories: 450, enabled: true, iconName: 'Sunrise' },
          { name: 'Mid-Morning Snack', time: '11:00 AM', targetCalories: 250, enabled: true, iconName: 'Coffee' },
          { name: 'Lunch', time: '01:30 PM', targetCalories: 600, enabled: true, iconName: 'Sun' },
          { name: 'Pre-Workout / Habit', time: '05:30 PM', targetCalories: 300, enabled: true, iconName: 'Coffee' },
          { name: 'Dinner & Recovery', time: '08:30 PM', targetCalories: 500, enabled: true, iconName: 'Moon' },
        ];
        break;
      case 'fasting':
        presetSlots = [
          { name: 'First Meal (Break-Fast)', time: '12:30 PM', targetCalories: 1000, enabled: true, iconName: 'Sun' },
          { name: 'Second Meal (Dinner)', time: '07:30 PM', targetCalories: 1100, enabled: true, iconName: 'Moon' },
        ];
        break;
    }

    const formattedSlots: MealSlot[] = presetSlots.map((s, idx) => ({
      ...s,
      id: `slot_preset_${Date.now()}_${idx}`,
      order: idx + 1,
    }));

    await reorderMealSlots(formattedSlots);
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Daily Meal Routine"
      maxWidth={520}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subtitle / Intro */}
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Configure your daily meal frequency and scheduled meal slots. Food tracking will adapt directly to your chosen routine.
        </Text>

        {/* Quick Routine Presets */}
        <View style={styles.presetsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Quick Routine Presets
          </Text>
          <View style={styles.presetButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset('4meals')}
              style={[
                styles.presetBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.presetBtnTitle, { color: theme.textPrimary }]}>4 Meals</Text>
              <Text style={[styles.presetBtnSub, { color: theme.textMuted }]}>Balanced</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset('5meals')}
              style={[
                styles.presetBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.presetBtnTitle, { color: theme.textPrimary }]}>5 Meals</Text>
              <Text style={[styles.presetBtnSub, { color: theme.textMuted }]}>Fitness / Diet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset('3meals')}
              style={[
                styles.presetBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.presetBtnTitle, { color: theme.textPrimary }]}>3 Meals</Text>
              <Text style={[styles.presetBtnSub, { color: theme.textMuted }]}>Standard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset('fasting')}
              style={[
                styles.presetBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.presetBtnTitle, { color: theme.textPrimary }]}>Fasting</Text>
              <Text style={[styles.presetBtnSub, { color: theme.textMuted }]}>16:8 (2 meals)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Active Meal Routine */}
        <View style={styles.slotsListSection}>
          <View style={styles.slotsListHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Current Meal Slots ({mealSlots.length} meals/day)
            </Text>
            {!isAddingNew && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsAddingNew(true)}
                style={[styles.addSlotBtn, { backgroundColor: theme.primaryBg }]}
              >
                <Plus size={13} color={theme.primary} />
                <Text style={[styles.addSlotBtnText, { color: theme.primary }]}>Add Slot</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form to add custom slot */}
          {isAddingNew && (
            <View
              style={[
                styles.newSlotCard,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.newSlotTitle, { color: theme.textPrimary }]}>
                Add Custom Meal Slot
              </Text>
              <View style={styles.newSlotInputs}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
                  ]}
                  placeholder="Meal Name (e.g. Pre-Workout Snack)"
                  placeholderTextColor={theme.textMuted}
                  value={newSlotName}
                  onChangeText={setNewSlotName}
                />
                <View style={styles.newSlotRow}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1, backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
                    ]}
                    placeholder="Time (e.g. 04:30 PM)"
                    placeholderTextColor={theme.textMuted}
                    value={newSlotTime}
                    onChangeText={setNewSlotTime}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1, backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
                    ]}
                    placeholder="Target Cals (e.g. 350)"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={newSlotCalories}
                    onChangeText={setNewSlotCalories}
                  />
                </View>
              </View>

              <View style={styles.newSlotActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsAddingNew(false)}
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleAddNewSlot}
                  style={[styles.saveSlotBtn, { backgroundColor: theme.primary }]}
                >
                  <Check size={14} color="#ffffff" />
                  <Text style={styles.saveSlotBtnText}>Add Meal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Slots list */}
          <View style={styles.slotsList}>
            <SortableList
              data={mealSlots}
              keyExtractor={(slot) => slot.id}
              onReorder={reorderMealSlots}
              renderItem={({ item: slot, index }) => (
                <View
                  key={slot.id}
                  style={[
                    styles.slotRow,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.slotOrderBadge}>
                      <Text style={[styles.slotOrderText, { color: theme.textMuted }]}>
                        {index + 1}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.slotMainInfo}>
                    <Text style={[styles.slotRowName, { color: theme.textPrimary }]}>
                      {slot.name}
                    </Text>
                    <View style={styles.slotMeta}>
                      <Clock size={11} color={theme.textMuted} />
                      <Text style={[styles.slotMetaText, { color: theme.textMuted }]}>
                        {slot.time}
                      </Text>
                      {slot.targetCalories && (
                        <>
                          <Text style={{ color: theme.textMuted, fontSize: 10 }}>•</Text>
                          <Text style={[styles.slotMetaText, { color: theme.textMuted }]}>
                            ~{slot.targetCalories} kcal
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Delete button (allow if more than 2 slots) */}
                  {mealSlots.length > 2 && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => deleteMealSlot(slot.id)}
                      style={styles.deleteSlotBtn}
                    >
                      <Trash2 size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        </View>

        {/* Done Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          style={[styles.doneBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    maxHeight: 520,
  },
  introText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  presetsSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  presetBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetBtnSub: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  slotsListSection: {
    marginBottom: 20,
  },
  slotsListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  addSlotBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  newSlotCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  newSlotTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  newSlotInputs: {
    gap: 8,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  newSlotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  newSlotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveSlotBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  slotsList: {
    gap: 6,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotOrderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  slotOrderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotMainInfo: {
    flex: 1,
  },
  slotRowName: {
    fontSize: 13,
    fontWeight: '700',
  },
  slotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  slotMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteSlotBtn: {
    padding: 6,
    cursor: 'pointer' as any,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    cursor: 'pointer' as any,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
