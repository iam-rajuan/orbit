import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { MealSlot, LoggedMealEntry } from '../../../types/nutrition';
import {
  Plus,
  Trash2,
  Clock,
  UtensilsCrossed,
  Sunrise,
  Sun,
  Coffee,
  Moon,
} from 'lucide-react-native';

interface MealSlotCardProps {
  slot: MealSlot;
  entries: LoggedMealEntry[];
  onAddFood: (slotId: string) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const MealSlotCard: React.FC<MealSlotCardProps> = ({
  slot,
  entries,
  onAddFood,
  onDeleteEntry,
}) => {
  const { theme, isDark } = useTheme();

  // Calculate slot totals
  let slotCals = 0;
  let slotProtein = 0;
  let slotCarbs = 0;
  let slotFat = 0;

  for (const item of entries) {
    slotCals += item.calories || 0;
    slotProtein += item.protein || 0;
    slotCarbs += item.carbs || 0;
    slotFat += item.fat || 0;
  }

  // Get appropriate slot icon
  const getSlotIcon = () => {
    switch (slot.iconName) {
      case 'Sunrise':
        return <Sunrise size={17} color="#F59E0B" />;
      case 'Sun':
        return <Sun size={17} color="#F59E0B" />;
      case 'Coffee':
        return <Coffee size={17} color="#10B981" />;
      case 'Moon':
        return <Moon size={17} color="#6366F1" />;
      default:
        return <UtensilsCrossed size={17} color={theme.primary} />;
    }
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
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surfaceSubtle },
            ]}
          >
            {getSlotIcon()}
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.slotName, { color: theme.textPrimary }]}>{slot.name}</Text>
              <View style={styles.timeTag}>
                <Clock size={11} color={theme.textMuted} />
                <Text style={[styles.timeText, { color: theme.textMuted }]}>{slot.time}</Text>
              </View>
            </View>

            {/* Macro Summary Line */}
            {entries.length > 0 && (
              <View style={styles.macroPillsRow}>
                <Text style={[styles.macroPill, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '800', color: theme.textPrimary }}>{slotCals}</Text> kcal
                </Text>
                <Text style={styles.dot}>•</Text>
                <Text style={[styles.macroPill, { color: '#10B981' }]}>
                  {Math.round(slotProtein)}g P
                </Text>
                <Text style={styles.dot}>•</Text>
                <Text style={[styles.macroPill, { color: '#F59E0B' }]}>
                  {Math.round(slotCarbs)}g C
                </Text>
                <Text style={styles.dot}>•</Text>
                <Text style={[styles.macroPill, { color: '#EC4899' }]}>
                  {Math.round(slotFat)}g F
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Add Food Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onAddFood(slot.id)}
          style={[
            styles.addFoodBtn,
            { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
          ]}
        >
          <Plus size={14} color={theme.primary} />
          <Text style={[styles.addFoodBtnText, { color: theme.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Entries List or Empty Prompt */}
      {entries.length > 0 ? (
        <View style={styles.entriesList}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entryItem,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.entryMain}>
                <Text style={[styles.entryName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {entry.name}
                </Text>
                <View style={styles.entrySubRow}>
                  <Text style={[styles.portionBadge, { color: theme.textMuted }]}>
                    {entry.portion !== 1 ? `${entry.portion}x ` : ''}{entry.servingUnit}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={[styles.entryCals, { color: isDark ? '#A5B4FC' : '#4F46E5' }]}>
                    {entry.calories} kcal
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={[styles.entryMacroText, { color: '#10B981' }]}>
                    {Math.round(entry.protein)}g P
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={[styles.entryMacroText, { color: '#F59E0B' }]}>
                    {Math.round(entry.carbs)}g C
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={[styles.entryMacroText, { color: '#EC4899' }]}>
                    {Math.round(entry.fat)}g F
                  </Text>
                </View>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onDeleteEntry(entry.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onAddFood(slot.id)}
          style={[styles.emptySlot, { borderColor: theme.border }]}
        >
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No food logged yet • Tap to log {slot.name.toLowerCase()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  macroPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  macroPill: {
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  addFoodBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entriesList: {
    marginTop: 12,
    gap: 6,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  entryMain: {
    flex: 1,
    marginRight: 8,
  },
  entryName: {
    fontSize: 13,
    fontWeight: '700',
  },
  entrySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  portionBadge: {
    fontSize: 10,
    fontWeight: '500',
  },
  entryCals: {
    fontSize: 11,
    fontWeight: '800',
  },
  entryMacroText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    cursor: 'pointer' as any,
  },
  emptySlot: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
