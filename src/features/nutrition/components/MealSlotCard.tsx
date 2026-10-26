import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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

import { useNutritionStore } from '../../../stores/useNutritionStore';
import { SortableList } from '../../../components/ui/SortableList';

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
  const { reorderLoggedEntries } = useNutritionStore();

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
        return <Sunrise size={16} color="#F59E0B" />;
      case 'Sun':
        return <Sun size={16} color="#F59E0B" />;
      case 'Coffee':
        return <Coffee size={16} color="#10B981" />;
      case 'Moon':
        return <Moon size={16} color="#6366F1" />;
      default:
        return <UtensilsCrossed size={16} color={theme.primary} />;
    }
  };

  // Helper for clean, non-repetitive serving display
  const formatServing = (portion: number, unit: string) => {
    if (!portion || portion === 1) return unit;
    if (unit.startsWith(`${portion} `)) return unit;
    return `${portion}x ${unit}`;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(24, 24, 28, 0.76)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.25 : 0.04,
          shadowRadius: 10,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              } as any)
            : {}),
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
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.slotName, { color: theme.textPrimary }]}>{slot.name}</Text>
              <View style={styles.timeTag}>
                <Clock size={10} color={theme.textMuted} />
                <Text style={[styles.timeText, { color: theme.textMuted }]}>{slot.time}</Text>
              </View>
            </View>

            {/* Macro Summary Line - clean and compact */}
            {entries.length > 0 && (
              <View style={styles.macroPillsRow}>
                <Text style={[styles.slotCalsText, { color: theme.textPrimary }]}>
                  {slotCals} <Text style={styles.kcalUnit}>kcal</Text>
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
          <Plus size={13} color={theme.primary} />
          <Text style={[styles.addFoodBtnText, { color: theme.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Entries List - Clean list view with hairline dividers (no nested card boxes) */}
      {entries.length > 0 ? (
        <View style={[styles.entriesList, { borderTopColor: theme.border }]}>
          <SortableList
            data={entries}
            keyExtractor={(entry) => entry.id}
            onReorder={reorderLoggedEntries}
            renderItem={({ item: entry, index }) => (
              <View
                key={entry.id}
                style={[
                  styles.entryRow,
                  index > 0 && [
                    styles.entryDivider,
                    { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                  ],
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={styles.entryLeft}>
                    <Text style={[styles.entryName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    <Text style={[styles.entryServing, { color: theme.textMuted }]} numberOfLines={1}>
                      {formatServing(entry.portion, entry.servingUnit)}
                    </Text>
                  </View>
                </View>

                <View style={styles.entryRight}>
                  <Text style={[styles.entryCals, { color: theme.textPrimary }]}>
                    {entry.calories}{' '}
                    <Text style={[styles.entryCalsUnit, { color: theme.textMuted }]}>kcal</Text>
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => onDeleteEntry(entry.id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Remove ${entry.name}`}
                  >
                    <Trash2 size={13} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onAddFood(slot.id)}
          style={[styles.emptySlot, { borderColor: theme.border }]}
        >
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No food logged yet • Tap to add
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotName: {
    fontSize: 14,
    fontWeight: '700',
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
  slotCalsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kcalUnit: {
    fontSize: 9,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  macroPill: {
    fontSize: 10,
    fontWeight: '600',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 9,
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  addFoodBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entriesList: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 2,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  entryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  entryLeft: {
    flex: 1,
    marginRight: 10,
  },
  entryName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  entryServing: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryCals: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryCalsUnit: {
    fontSize: 10,
    fontWeight: '400',
  },
  deleteBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  emptySlot: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
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
