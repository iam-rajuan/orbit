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
import { WishlistItem, WishlistPriority } from '../../types';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { offsetDateKey, getTodayKey } from '../../utils/date';
import {
  Gift,
  AlertCircle,
  Tag,
  Link as LinkIcon,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react-native';

interface WishlistFormModalProps {
  visible: boolean;
  item?: WishlistItem | null;
  onClose: () => void;
  onSave: (data: Omit<WishlistItem, 'id' | 'createdAt'>) => Promise<void>;
}

const CATEGORY_PRESETS = [
  'Office & Work',
  'Electronics',
  'Health & Fitness',
  'Books & Learning',
  'Home & Living',
  'Clothing & Style',
  'Personal',
  'Other',
];

interface WishlistFormContentProps {
  item?: WishlistItem | null;
  onClose: () => void;
  onSave: (data: Omit<WishlistItem, 'id' | 'createdAt'>) => Promise<void>;
}

const WishlistFormContent: React.FC<WishlistFormContentProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const { theme, isDark } = useTheme();
  const { settings } = useSettingsStore();

  const [title, setTitle] = useState(item ? item.title : '');
  const [estimatedPrice, setEstimatedPrice] = useState(
    item && item.estimatedPrice ? item.estimatedPrice.toString() : ''
  );
  const [category, setCategory] = useState(item?.category || 'Office & Work');
  const [priority, setPriority] = useState<WishlistPriority>(item?.priority || 'Medium');
  const [targetDate, setTargetDate] = useState(item?.targetDate || '');
  const [url, setUrl] = useState(item?.url || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title for this item.');
      return;
    }

    const priceNum = parseFloat(estimatedPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid estimated price.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        estimatedPrice: priceNum,
        category,
        priority,
        targetDate: targetDate.trim() || undefined,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        status: item ? item.status : 'saved',
      });
      onClose();
    } catch {
      setError('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.iconBadge}>
              <Gift size={18} color="#8B5CF6" />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {item ? 'Edit Wishlist Item' : 'Add to Future Wishlist'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Take note of what you need to buy later — never forget
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={15} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 1. Item Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Item Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            placeholder="e.g. Ergonomic Office Chair, Running Shoes, Laptop Stand..."
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* 2. Estimated Price & Priority Row */}
        <View style={styles.row}>
          {/* Estimated Price */}
          <View style={styles.halfCol}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Estimated Price ({settings.currency}) <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.priceInputBox,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}
            >
              <DollarSign size={15} color={theme.textMuted} />
              <TextInput
                style={[styles.priceInput, { color: theme.textPrimary }]}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={estimatedPrice}
                onChangeText={setEstimatedPrice}
              />
            </View>
          </View>

          {/* Priority */}
          <View style={styles.halfCol}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Priority (Need vs. Want)
            </Text>
            <View style={styles.prioritySelector}>
              {(['High', 'Medium', 'Low'] as WishlistPriority[]).map((p) => {
                const active = priority === p;
                const activeColor =
                  p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981';
                return (
                  <TouchableOpacity
                    key={p}
                    activeOpacity={0.7}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityBtn,
                      {
                        backgroundColor: active
                          ? isDark
                            ? `${activeColor}25`
                            : `${activeColor}15`
                          : theme.surfaceSubtle,
                        borderColor: active ? activeColor : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityBtnText,
                        { color: active ? activeColor : theme.textSecondary },
                      ]}
                    >
                      {p === 'High' ? 'Need' : p === 'Medium' ? 'Medium' : 'Want'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 3. Category Selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelWithIcon}>
            <Tag size={14} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textPrimary, marginBottom: 0 }]}>
              Category
            </Text>
          </View>
          <View style={styles.chipGrid}>
            {CATEGORY_PRESETS.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : theme.surfaceSubtle,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Target Date (Optional) */}
        <View style={styles.formGroup}>
          <View style={styles.labelWithIcon}>
            <Calendar size={14} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textPrimary, marginBottom: 0 }]}>
              Target Purchase Horizon (Optional)
            </Text>
          </View>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            placeholder="YYYY-MM-DD (e.g. 2026-11-30)"
            placeholderTextColor={theme.textMuted}
            value={targetDate}
            onChangeText={setTargetDate}
          />
          {/* Quick preset dates */}
          <View style={styles.quickDateRow}>
            {[
              { label: 'Next 30 Days', days: 30 },
              { label: 'Next 60 Days', days: 60 },
              { label: 'Next 90 Days', days: 90 },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.days}
                activeOpacity={0.7}
                onPress={() => setTargetDate(offsetDateKey(getTodayKey(), preset.days))}
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.quickDateText, { color: theme.textMuted }]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Product Link / URL (Optional) */}
        <View style={styles.formGroup}>
          <View style={styles.labelWithIcon}>
            <LinkIcon size={14} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textPrimary, marginBottom: 0 }]}>
              Product Link / URL (Optional)
            </Text>
          </View>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            placeholder="https://amazon.com/... or store page link"
            placeholderTextColor={theme.textMuted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
          />
        </View>

        {/* 6. Notes & Reason to Buy (Cooling-off reflection) */}
        <View style={styles.formGroup}>
          <View style={styles.labelWithIcon}>
            <FileText size={14} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textPrimary, marginBottom: 0 }]}>
              Notes, Specs & Justification
            </Text>
          </View>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            placeholder="Why do you want this? Any discount codes or specs to remember?"
            placeholderTextColor={theme.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
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
            title={item ? 'Save Changes' : 'Add to Wishlist'}
            variant="primary"
            size="md"
            loading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
  );
};

export const WishlistFormModal: React.FC<WishlistFormModalProps> = ({
  visible,
  item,
  onClose,
  onSave,
}) => {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title=""
      maxWidth={520}
    >
      {visible ? (
        <WishlistFormContent
          key={item ? item.id : 'new-item'}
          item={item}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    maxHeight: 560,
  },
  modalHeader: {
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
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  errorContainer: {
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 4,
    height: 42,
  },
  priorityBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
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
