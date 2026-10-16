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
import { GoalType } from '../../../types/nutrition';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { Check, TrendingDown, TrendingUp, Scale } from 'lucide-react-native';

interface NutritionGoalsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NutritionGoalsModal: React.FC<NutritionGoalsModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const { goals, updateGoals } = useNutritionStore();

  const [goalType, setGoalType] = useState<GoalType>(goals.goalType);
  const [calorieTarget, setCalorieTarget] = useState(String(goals.calorieTarget));
  const [maintenanceCalories, setMaintenanceCalories] = useState(String(goals.maintenanceCalories));
  const [proteinTarget, setProteinTarget] = useState(String(goals.proteinTarget));
  const [carbsTarget, setCarbsTarget] = useState(String(goals.carbsTarget));
  const [fatTarget, setFatTarget] = useState(String(goals.fatTarget));
  const [waterTarget, setWaterTarget] = useState(String(goals.waterTargetMl));

  const handleSave = async () => {
    const cals = parseInt(calorieTarget, 10) || 2100;
    const maint = parseInt(maintenanceCalories, 10) || 2450;
    const prot = parseInt(proteinTarget, 10) || 140;
    const carbs = parseInt(carbsTarget, 10) || 210;
    const fat = parseInt(fatTarget, 10) || 55;
    const water = parseInt(waterTarget, 10) || 3000;

    await updateGoals({
      goalType,
      calorieTarget: cals,
      maintenanceCalories: maint,
      targetDeficit: maint - cals,
      proteinTarget: prot,
      carbsTarget: carbs,
      fatTarget: fat,
      waterTargetMl: water,
    });

    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Nutrition & Macro Targets"
      maxWidth={520}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Goal Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Primary Objective</Text>
          <View style={styles.goalTypesRow}>
            {/* Cut / Deficit */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setGoalType('cut')}
              style={[
                styles.goalTypeBtn,
                {
                  backgroundColor:
                    goalType === 'cut'
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.2)'
                        : '#ECFDF5'
                      : theme.surfaceSubtle,
                  borderColor:
                    goalType === 'cut' ? '#10B981' : theme.border,
                },
              ]}
            >
              <TrendingDown size={16} color="#10B981" />
              <Text
                style={[
                  styles.goalTypeTitle,
                  { color: goalType === 'cut' ? '#10B981' : theme.textPrimary },
                ]}
              >
                Fat Loss
              </Text>
              <Text style={[styles.goalTypeSub, { color: theme.textMuted }]}>
                Calorie Deficit
              </Text>
            </TouchableOpacity>

            {/* Maintain */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setGoalType('maintain')}
              style={[
                styles.goalTypeBtn,
                {
                  backgroundColor:
                    goalType === 'maintain'
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.2)'
                        : '#EEF2FF'
                      : theme.surfaceSubtle,
                  borderColor:
                    goalType === 'maintain' ? theme.primary : theme.border,
                },
              ]}
            >
              <Scale size={16} color={theme.primary} />
              <Text
                style={[
                  styles.goalTypeTitle,
                  { color: goalType === 'maintain' ? theme.primary : theme.textPrimary },
                ]}
              >
                Maintain
              </Text>
              <Text style={[styles.goalTypeSub, { color: theme.textMuted }]}>
                Body Recomp
              </Text>
            </TouchableOpacity>

            {/* Bulk / Surplus */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setGoalType('bulk')}
              style={[
                styles.goalTypeBtn,
                {
                  backgroundColor:
                    goalType === 'bulk'
                      ? isDark
                        ? 'rgba(245, 158, 11, 0.2)'
                        : '#FFFBEB'
                      : theme.surfaceSubtle,
                  borderColor:
                    goalType === 'bulk' ? '#F59E0B' : theme.border,
                },
              ]}
            >
              <TrendingUp size={16} color="#F59E0B" />
              <Text
                style={[
                  styles.goalTypeTitle,
                  { color: goalType === 'bulk' ? '#F59E0B' : theme.textPrimary },
                ]}
              >
                Muscle Gain
              </Text>
              <Text style={[styles.goalTypeSub, { color: theme.textMuted }]}>
                Clean Surplus
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calorie Inputs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Calorie Targets</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Daily Intake Target (kcal)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, color: theme.textPrimary, borderColor: theme.border },
                ]}
                keyboardType="numeric"
                value={calorieTarget}
                onChangeText={setCalorieTarget}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Maintenance Level (kcal)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, color: theme.textPrimary, borderColor: theme.border },
                ]}
                keyboardType="numeric"
                value={maintenanceCalories}
                onChangeText={setMaintenanceCalories}
              />
            </View>
          </View>
        </View>

        {/* Macronutrient Split */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Macronutrient Targets</Text>
          <View style={styles.macrosRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: '#10B981' }]}>Protein (g)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, color: theme.textPrimary, borderColor: theme.border },
                ]}
                keyboardType="numeric"
                value={proteinTarget}
                onChangeText={setProteinTarget}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: '#F59E0B' }]}>Carbs (g)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, color: theme.textPrimary, borderColor: theme.border },
                ]}
                keyboardType="numeric"
                value={carbsTarget}
                onChangeText={setCarbsTarget}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: '#EC4899' }]}>Fat (g)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, color: theme.textPrimary, borderColor: theme.border },
                ]}
                keyboardType="numeric"
                value={fatTarget}
                onChangeText={setFatTarget}
              />
            </View>
          </View>
        </View>

        {/* Water Target */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hydration Goal</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: '#0EA5E9' }]}>Daily Water Target (ml)</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.surfaceSubtle, color: theme.textPrimary, borderColor: theme.border },
              ]}
              keyboardType="numeric"
              value={waterTarget}
              onChangeText={setWaterTarget}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        >
          <Check size={16} color="#ffffff" />
          <Text style={styles.saveBtnText}>Save Targets</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    maxHeight: 520,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  goalTypesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  goalTypeTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  goalTypeSub: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 10,
    cursor: 'pointer' as any,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
