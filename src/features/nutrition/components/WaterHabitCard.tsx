import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { DailyHabitLog } from '../../../types/nutrition';
import {
  Droplets,
  Plus,
  Minus,
  FileEdit,
  Check,
} from 'lucide-react-native';

interface WaterHabitCardProps {
  waterIntakeMl: number;
  waterTargetMl: number;
  habit?: DailyHabitLog;
  onLogWater: (delta: number) => void;
  onToggleHabit?: (key: 'stuckToDiet' | 'noJunkFood' | 'supplementsTaken') => void;
  onSaveNotes: (notes: string) => void;
}

export const WaterHabitCard: React.FC<WaterHabitCardProps> = ({
  waterIntakeMl,
  waterTargetMl,
  habit,
  onLogWater,
  onSaveNotes,
}) => {
  const { theme, isDark } = useTheme();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(habit?.notes || '');

  const waterRatio = waterTargetMl > 0 ? Math.min(1, waterIntakeMl / waterTargetMl) : 0;
  const waterPct = Math.round(waterRatio * 100);

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    onSaveNotes(notesText);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadowColor,
          shadowOpacity: theme.shadowOpacity,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Column: Water Tracker */}
        <View style={styles.waterColumn}>
          <View style={styles.columnHeader}>
            <Droplets size={16} color="#0EA5E9" />
            <Text style={[styles.columnTitle, { color: theme.textPrimary }]}>
              Hydration
            </Text>
            <Text style={[styles.waterTargetSub, { color: theme.textMuted }]}>
              {waterPct}%
            </Text>
          </View>

          <View style={styles.waterDisplay}>
            <Text style={[styles.waterCurrent, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
              {waterIntakeMl}
            </Text>
            <Text style={[styles.waterUnit, { color: theme.textMuted }]}>
              / {waterTargetMl} ml
            </Text>
          </View>

          {/* Water Progress Bar */}
          <View style={[styles.waterBarTrack, { backgroundColor: isDark ? '#27272A' : '#F0F9FF' }]}>
            <View
              style={[
                styles.waterBarFill,
                {
                  width: `${waterPct}%`,
                  backgroundColor: '#0EA5E9',
                },
              ]}
            />
          </View>

          {/* Quick Buttons */}
          <View style={styles.waterBtnsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onLogWater(250)}
              style={[
                styles.waterQuickBtn,
                { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE', borderColor: '#BAE6FD' },
              ]}
            >
              <Plus size={11} color="#0284C7" />
              <Text style={[styles.waterQuickText, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                250ml
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onLogWater(500)}
              style={[
                styles.waterQuickBtn,
                { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE', borderColor: '#BAE6FD' },
              ]}
            >
              <Plus size={11} color="#0284C7" />
              <Text style={[styles.waterQuickText, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                500ml
              </Text>
            </TouchableOpacity>

            {waterIntakeMl > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onLogWater(-250)}
                style={[
                  styles.waterMinusBtn,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <Minus size={12} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Habit Notes Section */}
      <View style={[styles.notesSection, { borderTopColor: theme.border }]}>
        {isEditingNotes ? (
          <View style={styles.notesEditContainer}>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.surfaceSubtle,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Add notes about your energy, hunger levels, or meal prep..."
              placeholderTextColor={theme.textMuted}
              value={notesText}
              onChangeText={setNotesText}
              multiline
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSaveNotes}
              style={[styles.saveNoteBtn, { backgroundColor: theme.primary }]}
            >
              <Check size={14} color="#ffffff" />
              <Text style={styles.saveNoteBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setNotesText(habit?.notes || '');
              setIsEditingNotes(true);
            }}
            style={styles.notesViewRow}
          >
            <FileEdit size={13} color={theme.textMuted} />
            <Text
              style={[
                styles.notesText,
                { color: habit?.notes ? theme.textSecondary : theme.textMuted },
              ]}
              numberOfLines={2}
            >
              {habit?.notes || 'Tap to add daily food & energy notes...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    width: '100%',
  },
  waterColumn: {
    width: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  waterTargetSub: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  waterDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  waterCurrent: {
    fontSize: 18,
    fontWeight: '900',
  },
  waterUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  waterBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  waterBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  waterBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  waterQuickText: {
    fontSize: 11,
    fontWeight: '700',
  },
  waterMinusBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },

  notesSection: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 10,
  },
  notesViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer' as any,
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
  notesEditContainer: {
    gap: 8,
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    minHeight: 48,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  saveNoteBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
