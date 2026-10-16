import React, { useState, useMemo } from 'react';
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
import { FoodItem } from '../../../types/nutrition';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import {
  Search,
  Plus,
  Check,
  Star,
  UtensilsCrossed,
} from 'lucide-react-native';

interface FoodLogModalProps {
  visible: boolean;
  mealSlotId: string | null;
  date: string;
  onClose: () => void;
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({
  visible,
  mealSlotId,
  date,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const { mealSlots, foodLibrary, addLoggedEntry, addCustomFood } = useNutritionStore();

  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);

  // Custom Food Form State
  const [customName, setCustomName] = useState('');
  const [customServing, setCustomServing] = useState('1 serving');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const targetSlot = mealSlots.find((s) => s.id === mealSlotId) || mealSlots[0];

  const categories = ['All', 'Protein', 'Carbs', 'Fats', 'Fruits', 'Snacks', 'Favorites'];

  // Filtered Food Library
  const filteredFoods = useMemo(() => {
    return foodLibrary.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Favorites') return !!item.isFavorite;
      return item.category === selectedCategory;
    });
  }, [foodLibrary, searchQuery, selectedCategory]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setPortionMultiplier(1.0);
  };

  const handleLogFromLibrary = async () => {
    if (!selectedFood || !mealSlotId) return;

    const cals = Math.round(selectedFood.calories * portionMultiplier);
    const prot = Math.round(selectedFood.protein * portionMultiplier * 10) / 10;
    const carb = Math.round(selectedFood.carbs * portionMultiplier * 10) / 10;
    const fat = Math.round(selectedFood.fat * portionMultiplier * 10) / 10;
    const fiber = selectedFood.fiber ? Math.round(selectedFood.fiber * portionMultiplier * 10) / 10 : undefined;

    await addLoggedEntry({
      date,
      mealSlotId,
      foodItemId: selectedFood.id,
      name: selectedFood.name,
      portion: portionMultiplier,
      servingUnit: selectedFood.servingSize,
      calories: cals,
      protein: prot,
      carbs: carb,
      fat,
      fiber,
    });

    setSelectedFood(null);
    onClose();
  };

  const handleLogCustomFood = async () => {
    if (!customName.trim() || !customCalories.trim() || !mealSlotId) return;

    const cals = parseFloat(customCalories) || 0;
    const prot = parseFloat(customProtein) || 0;
    const carb = parseFloat(customCarbs) || 0;
    const fat = parseFloat(customFat) || 0;

    if (saveToLibrary) {
      await addCustomFood({
        name: customName.trim(),
        category: 'Custom',
        servingSize: customServing.trim() || '1 serving',
        calories: cals,
        protein: prot,
        carbs: carb,
        fat,
      });
    }

    await addLoggedEntry({
      date,
      mealSlotId,
      name: customName.trim(),
      portion: 1.0,
      servingUnit: customServing.trim() || '1 serving',
      calories: Math.round(cals),
      protein: prot,
      carbs: carb,
      fat,
    });

    // Reset custom form
    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={`Log to ${targetSlot?.name || 'Meal'}`}
      maxWidth={540}
    >
      <View style={styles.container}>
        {/* Tab Switcher: Food Library vs Quick Add */}
        <View
          style={[
            styles.tabSwitcher,
            { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('library')}
            style={[
              styles.tabBtn,
              activeTab === 'library' && {
                backgroundColor: theme.surface,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
              },
            ]}
          >
            <UtensilsCrossed
              size={14}
              color={activeTab === 'library' ? theme.primary : theme.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'library' ? theme.textPrimary : theme.textMuted },
                activeTab === 'library' && styles.tabBtnTextActive,
              ]}
            >
              Food Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('custom')}
            style={[
              styles.tabBtn,
              activeTab === 'custom' && {
                backgroundColor: theme.surface,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
              },
            ]}
          >
            <Plus
              size={14}
              color={activeTab === 'custom' ? theme.primary : theme.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'custom' ? theme.textPrimary : theme.textMuted },
                activeTab === 'custom' && styles.tabBtnTextActive,
              ]}
            >
              Quick Custom
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'library' ? (
          <View style={styles.libraryContainer}>
            {/* Search Input */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}
            >
              <Search size={15} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search food (e.g. Chicken, Eggs, Rice, Banana...)"
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Categories horizontal scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive
                          ? theme.primary
                          : theme.surfaceSubtle,
                        borderColor: isActive ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isActive ? '#ffffff' : theme.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Food List */}
            <ScrollView style={styles.foodListScroll} showsVerticalScrollIndicator={false}>
              {filteredFoods.map((food) => {
                const isSelected = selectedFood?.id === food.id;
                return (
                  <TouchableOpacity
                    key={food.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectFood(food)}
                    style={[
                      styles.foodCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.15)'
                            : '#EEF2FF'
                          : theme.surfaceSubtle,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.foodCardMain}>
                      <View style={styles.foodCardTitleRow}>
                        <Text
                          style={[
                            styles.foodName,
                            { color: theme.textPrimary },
                            isSelected && { color: theme.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {food.name}
                        </Text>
                        {food.isFavorite && (
                          <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        )}
                      </View>
                      <Text style={[styles.foodServing, { color: theme.textMuted }]}>
                        {food.servingSize} • {food.category}
                      </Text>
                    </View>

                    <View style={styles.foodMacros}>
                      <Text style={[styles.foodCalories, { color: theme.textPrimary }]}>
                        {food.calories} kcal
                      </Text>
                      <Text style={styles.foodMacroBreakdown}>
                        <Text style={{ color: '#10B981' }}>{food.protein}P </Text>
                        <Text style={{ color: '#F59E0B' }}>{food.carbs}C </Text>
                        <Text style={{ color: '#EC4899' }}>{food.fat}F</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Portion Adjuster & Confirm if selected */}
            {selectedFood && (
              <View
                style={[
                  styles.portionSection,
                  {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                  },
                ]}
              >
                <View style={styles.portionHeader}>
                  <Text style={[styles.portionTitle, { color: theme.textPrimary }]}>
                    Portion Multiplier
                  </Text>
                  <Text style={[styles.calculatedCals, { color: theme.primary }]}>
                    {Math.round(selectedFood.calories * portionMultiplier)} kcal
                  </Text>
                </View>

                {/* Portion Quick Buttons */}
                <View style={styles.multiplierRow}>
                  {[0.5, 1.0, 1.5, 2.0].map((val) => {
                    const isValSelected = portionMultiplier === val;
                    return (
                      <TouchableOpacity
                        key={val}
                        activeOpacity={0.7}
                        onPress={() => setPortionMultiplier(val)}
                        style={[
                          styles.multiplierBtn,
                          {
                            backgroundColor: isValSelected
                              ? theme.primary
                              : theme.surfaceSubtle,
                            borderColor: isValSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.multiplierText,
                            { color: isValSelected ? '#ffffff' : theme.textPrimary },
                          ]}
                        >
                          {val}x
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Real-time Macro Preview */}
                <View style={styles.previewMacrosRow}>
                  <Text style={[styles.previewMacroItem, { color: '#10B981' }]}>
                    Protein: {Math.round(selectedFood.protein * portionMultiplier * 10) / 10}g
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={[styles.previewMacroItem, { color: '#F59E0B' }]}>
                    Carbs: {Math.round(selectedFood.carbs * portionMultiplier * 10) / 10}g
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={[styles.previewMacroItem, { color: '#EC4899' }]}>
                    Fat: {Math.round(selectedFood.fat * portionMultiplier * 10) / 10}g
                  </Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleLogFromLibrary}
                  style={[styles.confirmLogBtn, { backgroundColor: theme.primary }]}
                >
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.confirmLogBtnText}>
                    Log {selectedFood.name} ({Math.round(selectedFood.calories * portionMultiplier)} kcal)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Custom Food Entry Tab */
          <ScrollView style={styles.customFormScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Food Name *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. Protein Smoothie, Homemade Chicken Roll"
                placeholderTextColor={theme.textMuted}
                value={customName}
                onChangeText={setCustomName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Serving Unit</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. 1 glass (250ml), 1 bowl (150g)"
                placeholderTextColor={theme.textMuted}
                value={customServing}
                onChangeText={setCustomServing}
              />
            </View>

            {/* Row: Calories */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Calories (kcal) *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. 350"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={customCalories}
                onChangeText={setCustomCalories}
              />
            </View>

            {/* Row: Macros (Protein, Carbs, Fat) */}
            <View style={styles.macroInputsRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: '#10B981' }]}>Protein (g)</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="25"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={customProtein}
                  onChangeText={setCustomProtein}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: '#F59E0B' }]}>Carbs (g)</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={customCarbs}
                  onChangeText={setCustomCarbs}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: '#EC4899' }]}>Fat (g)</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="8"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={customFat}
                  onChangeText={setCustomFat}
                />
              </View>
            </View>

            {/* Save to library checkbox */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSaveToLibrary(!saveToLibrary)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    backgroundColor: saveToLibrary ? theme.primary : 'transparent',
                    borderColor: saveToLibrary ? theme.primary : theme.border,
                  },
                ]}
              >
                {saveToLibrary && <Check size={12} color="#ffffff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
                Save this food to my library for future quick adds
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogCustomFood}
              style={[
                styles.confirmLogBtn,
                { backgroundColor: theme.primary, marginTop: 16 },
                (!customName.trim() || !customCalories.trim()) && { opacity: 0.5 },
              ]}
              disabled={!customName.trim() || !customCalories.trim()}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.confirmLogBtnText}>Log Custom Meal</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 520,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '800',
  },
  libraryContainer: {
    flexDirection: 'column',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoriesScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  foodListScroll: {
    maxHeight: 210,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    cursor: 'pointer' as any,
  },
  foodCardMain: {
    flex: 1,
    marginRight: 8,
  },
  foodCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodName: {
    fontSize: 13,
    fontWeight: '700',
  },
  foodServing: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  foodMacros: {
    alignItems: 'flex-end',
  },
  foodCalories: {
    fontSize: 12,
    fontWeight: '800',
  },
  foodMacroBreakdown: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  portionSection: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 6,
  },
  portionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  portionTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  calculatedCals: {
    fontSize: 14,
    fontWeight: '900',
  },
  multiplierRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  multiplierBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  previewMacroItem: {
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  confirmLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  confirmLogBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  customFormScroll: {
    maxHeight: 380,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  formInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  macroInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
    cursor: 'pointer' as any,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 11,
    flex: 1,
  },
});
