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
import { BmiSpeedometerGauge } from './BmiSpeedometerGauge';
import {
  Scale,
  Info,
  Activity,
  Heart,
} from 'lucide-react-native';

interface BmiCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyWeight?: (weightKg: number) => void;
}

export const BmiCalculatorModal: React.FC<BmiCalculatorModalProps> = ({
  visible,
  onClose,
  onApplyWeight,
}) => {
  const { theme } = useTheme();

  // Unit systems
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  // Input states (stored in metric under the hood)
  const [weightKg, setWeightKg] = useState<number>(72);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [age, setAge] = useState<number>(26);
  const [sex, setSex] = useState<'male' | 'female'>('male');

  // Imperial display helpers
  const weightLbs = Math.round(weightKg * 2.20462);
  const totalInches = heightCm / 2.54;
  const heightFeet = Math.floor(totalInches / 12);
  const heightInches = Math.round(totalInches % 12);

  // Calculations
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

  // Category determination
  const getBmiCategory = (val: number) => {
    if (val < 18.5) {
      return {
        label: 'Underweight',
        color: '#0EA5E9',
        sublabel: 'Below recommended body weight',
        advice: 'Focus on nutrient-dense foods, lean protein, and surplus calories to reach a resilient body mass.',
      };
    }
    if (val < 25.0) {
      return {
        label: 'Normal / Healthy Weight',
        color: '#10B981',
        sublabel: 'Optimal health & longevity zone',
        advice: 'Your body mass is in the optimal range associated with lowest risk of metabolic and cardiovascular illness.',
      };
    }
    if (val < 30.0) {
      return {
        label: 'Overweight',
        color: '#F59E0B',
        sublabel: 'Moderate excess body mass',
        advice: 'A mild caloric deficit and consistent daily step count can comfortably bring you back to the normal zone.',
      };
    }
    if (val < 35.0) {
      return {
        label: 'Obesity Class I',
        color: '#F97316',
        sublabel: 'Elevated health risk',
        advice: 'Prioritize structured caloric deficits, whole food swaps, and strength training to reduce visceral fat.',
      };
    }
    return {
      label: 'Obesity Class II+',
      color: '#EF4444',
      sublabel: 'High metabolic risk',
      advice: 'Target progressive, sustainable weight loss. Consult a healthcare professional for clinical guidance.',
    };
  };

  const category = getBmiCategory(bmi);

  // Healthy weight range for this height (BMI 18.5 to 24.9)
  const minHealthyKg = 18.5 * heightM * heightM;
  const maxHealthyKg = 24.9 * heightM * heightM;
  const minHealthyDisplay =
    weightUnit === 'kg'
      ? `${minHealthyKg.toFixed(1)} kg`
      : `${(minHealthyKg * 2.20462).toFixed(1)} lbs`;
  const maxHealthyDisplay =
    weightUnit === 'kg'
      ? `${maxHealthyKg.toFixed(1)} kg`
      : `${(maxHealthyKg * 2.20462).toFixed(1)} lbs`;

  // Weight delta to normal zone
  let weightDeltaNotice = '';
  if (bmi < 18.5) {
    const toGain = minHealthyKg - weightKg;
    const toGainDisplay =
      weightUnit === 'kg'
        ? `${toGain.toFixed(1)} kg`
        : `${(toGain * 2.20462).toFixed(1)} lbs`;
    weightDeltaNotice = `Gain +${toGainDisplay} to reach the normal weight threshold.`;
  } else if (bmi > 24.9) {
    const toLose = weightKg - maxHealthyKg;
    const toLoseDisplay =
      weightUnit === 'kg'
        ? `${toLose.toFixed(1)} kg`
        : `${(toLose * 2.20462).toFixed(1)} lbs`;
    weightDeltaNotice = `Lose -${toLoseDisplay} to reach the upper normal weight threshold.`;
  } else {
    weightDeltaNotice = 'You are comfortably within your ideal healthy weight range.';
  }

  // Deurenberg Adult Body Fat % formula
  // BF% = 1.20 * BMI + 0.23 * Age - 16.2 * sex - 5.4 (sex: 1 for male, 0 for female)
  const sexFactor = sex === 'male' ? 1 : 0;
  const estimatedBodyFat = Math.max(
    5,
    Math.min(55, 1.2 * bmi + 0.23 * age - 16.2 * sexFactor - 5.4)
  );

  // BMI Prime (ratio to upper normal limit of 25)
  const bmiPrime = (bmi / 25).toFixed(2);

  // Handler for weight changes
  const handleWeightChange = (newVal: number, unit: 'kg' | 'lbs') => {
    if (unit === 'kg') {
      setWeightKg(Math.max(25, newVal));
    } else {
      setWeightKg(Math.max(25, newVal / 2.20462));
    }
  };

  // Handler for height changes
  const handleHeightChange = (newVal: number) => {
    setHeightCm(Math.max(100, Math.min(240, newVal)));
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title=""
      maxWidth={540}
    >
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Modal Title Row */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.iconBadge}>
              <Activity size={18} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Body Mass Index (BMI)
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Speedometer Health Gauge & Ideal Weight Range
              </Text>
            </View>
          </View>
        </View>

        {/* SPEEDOMETER RESULT GAUGE */}
        <View
          style={[
            styles.gaugeCard,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
            },
          ]}
        >
          <BmiSpeedometerGauge
            bmi={bmi}
            category={category}
            size={290}
          />
        </View>

        {/* HEALTH RANGE CALLOUT */}
        <View
          style={[
            styles.rangeBanner,
            {
              backgroundColor: `${category.color}12`,
              borderColor: `${category.color}35`,
            },
          ]}
        >
          <View style={styles.rangeRow}>
            <Heart size={15} color={category.color} />
            <Text style={[styles.rangeTitle, { color: category.color }]}>
              Healthy Weight for {heightCm} cm: {minHealthyDisplay} – {maxHealthyDisplay}
            </Text>
          </View>
          <Text style={[styles.rangeDesc, { color: theme.textSecondary }]}>
            {weightDeltaNotice}
          </Text>
        </View>

        {/* INPUTS CONTAINER */}
        <View
          style={[
            styles.inputsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            YOUR MEASUREMENTS
          </Text>

          {/* 1. WEIGHT INPUT */}
          <View style={styles.inputRow}>
            <View style={styles.inputLabelGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Weight:
              </Text>
              {/* Unit Toggle */}
              <View
                style={[
                  styles.smallUnitToggle,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setWeightUnit('kg')}
                  style={[
                    styles.unitTab,
                    weightUnit === 'kg' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitTabText,
                      { color: weightUnit === 'kg' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setWeightUnit('lbs')}
                  style={[
                    styles.unitTab,
                    weightUnit === 'lbs' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitTabText,
                      { color: weightUnit === 'lbs' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleWeightChange(
                    (weightUnit === 'kg' ? weightKg : weightLbs) - 1,
                    weightUnit
                  )
                }
                style={[
                  styles.stepBtn,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>-1</Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.inputFieldBox,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  keyboardType="numeric"
                  value={
                    weightUnit === 'kg'
                      ? weightKg.toFixed(1)
                      : weightLbs.toString()
                  }
                  onChangeText={(val) => {
                    const n = parseFloat(val);
                    if (!isNaN(n)) handleWeightChange(n, weightUnit);
                  }}
                />
                <Text style={[styles.inputSuffix, { color: theme.textMuted }]}>
                  {weightUnit}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleWeightChange(
                    (weightUnit === 'kg' ? weightKg : weightLbs) + 1,
                    weightUnit
                  )
                }
                style={[
                  styles.stepBtn,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. HEIGHT INPUT */}
          <View style={styles.inputRow}>
            <View style={styles.inputLabelGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Height:
              </Text>
              <View
                style={[
                  styles.smallUnitToggle,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setHeightUnit('cm')}
                  style={[
                    styles.unitTab,
                    heightUnit === 'cm' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitTabText,
                      { color: heightUnit === 'cm' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setHeightUnit('ft')}
                  style={[
                    styles.unitTab,
                    heightUnit === 'ft' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitTabText,
                      { color: heightUnit === 'ft' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    ft/in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepperRow}>
              {heightUnit === 'cm' ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleHeightChange(heightCm - 1)}
                    style={[
                      styles.stepBtn,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>-1</Text>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.inputFieldBox,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.textInput, { color: theme.textPrimary }]}
                      keyboardType="numeric"
                      value={heightCm.toString()}
                      onChangeText={(val) => {
                        const n = parseInt(val, 10);
                        if (!isNaN(n)) handleHeightChange(n);
                      }}
                    />
                    <Text style={[styles.inputSuffix, { color: theme.textMuted }]}>cm</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleHeightChange(heightCm + 1)}
                    style={[
                      styles.stepBtn,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>+1</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View
                  style={[
                    styles.inputFieldBox,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.textInput, { color: theme.textPrimary }]}>
                    {heightFeet}&apos; {heightInches}&quot; ({heightCm} cm)
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 3. AGE & BIOLOGICAL SEX ROW */}
          <View style={styles.ageSexRow}>
            {/* Age */}
            <View style={styles.halfCol}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary, marginBottom: 6 }]}>
                Age:
              </Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAge(Math.max(10, age - 1))}
                  style={[
                    styles.stepBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>-1</Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.inputFieldBox,
                    { flex: 1, backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary }]}
                    keyboardType="numeric"
                    value={age.toString()}
                    onChangeText={(val) => {
                      const n = parseInt(val, 10);
                      if (!isNaN(n)) setAge(Math.max(1, n));
                    }}
                  />
                  <Text style={[styles.inputSuffix, { color: theme.textMuted }]}>yrs</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAge(age + 1)}
                  style={[
                    styles.stepBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>+1</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sex Toggle */}
            <View style={styles.halfCol}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary, marginBottom: 6 }]}>
                Biological Sex:
              </Text>
              <View
                style={[
                  styles.sexToggle,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSex('male')}
                  style={[
                    styles.sexBtn,
                    sex === 'male' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.sexBtnText,
                      { color: sex === 'male' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSex('female')}
                  style={[
                    styles.sexBtn,
                    sex === 'female' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.sexBtnText,
                      { color: sex === 'female' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* METRIC TILES: BODY FAT, BMI PRIME, PONDRAL */}
        <View style={styles.kpiGrid}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>
              EST. BODY FAT
            </Text>
            <Text style={[styles.kpiValue, { color: theme.primary }]}>
              ~{estimatedBodyFat.toFixed(1)}%
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
              Deurenberg Clinical Model
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>
              BMI PRIME
            </Text>
            <Text style={[styles.kpiValue, { color: '#0EA5E9' }]}>
              {bmiPrime}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
              Ratio to 25.0 Upper Limit
            </Text>
          </View>
        </View>

        {/* MEDICAL GUIDANCE CARD */}
        <View
          style={[
            styles.adviceCard,
            { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
          ]}
        >
          <View style={styles.adviceHeader}>
            <Info size={15} color={category.color} />
            <Text style={[styles.adviceTitle, { color: theme.textPrimary }]}>
              Clinical Context & Assessment
            </Text>
          </View>
          <Text style={[styles.adviceText, { color: theme.textSecondary }]}>
            {category.advice}
          </Text>
        </View>

        {/* OPTIONAL APPLY BUTTON */}
        {onApplyWeight && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onApplyWeight(weightKg);
              onClose();
            }}
            style={[styles.applyWeightBtn, { backgroundColor: theme.primary }]}
          >
            <Scale size={15} color="#FFFFFF" />
            <Text style={styles.applyWeightText}>
              Apply {weightKg.toFixed(1)} kg to Weight Planner
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    maxHeight: 580,
  },
  modalHeader: {
    paddingBottom: 10,
    marginBottom: 8,
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  gaugeCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rangeBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rangeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  rangeDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  inputsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  smallUnitToggle: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  unitTab: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitTabText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    minWidth: 90,
  },
  textInput: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 10,
    marginLeft: 4,
  },
  ageSexRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  halfCol: {
    flex: 1,
  },
  sexToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    padding: 2,
  },
  sexBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  sexBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    marginTop: 2,
  },
  adviceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  adviceText: {
    fontSize: 11,
    lineHeight: 16,
  },
  applyWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 6,
    cursor: 'pointer' as any,
  },
  applyWeightText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
