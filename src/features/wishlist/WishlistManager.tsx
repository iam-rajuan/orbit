import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDateStore } from '../../stores/useDateStore';
import { WishlistItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { generateId } from '../../utils/id';
import { WishlistFormModal } from './WishlistFormModal';
import { HorizontalScrollRow } from '../../components/ui/HorizontalScrollRow';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Gift,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Tag,
} from 'lucide-react-native';

export const WishlistManager: React.FC = () => {
  const { theme, isDark } = useTheme();

  const { settings } = useSettingsStore();
  const { selectedDate } = useDateStore();
  const { createExpense } = useExpenseStore();

  const {
    items,
    searchQuery,
    filterStatus,
    filterPriority,
    setSearchQuery,
    setFilterStatus,
    setFilterPriority,
    addItem,
    updateItem,
    deleteItem,
    markAsPurchased,
    markAsDropped,
    restoreItem,
    getFilteredItems,
    getStats,
  } = useWishlistStore();

  // Modals & Dialogs
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [purchaseConfirmItem, setPurchaseConfirmItem] = useState<WishlistItem | null>(null);

  const filteredItems = getFilteredItems();
  const stats = getStats();

  const handleOpenEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleSaveItem = async (data: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    if (editingItem) {
      await updateItem({
        ...editingItem,
        ...data,
      });
    } else {
      await addItem(data);
    }
  };

  // Convert to actual daily expense
  const handleConfirmPurchaseWithExpense = async (createExpenseRecord: boolean) => {
    if (!purchaseConfirmItem) return;

    let expenseId: string | undefined = undefined;

    if (createExpenseRecord) {
      expenseId = generateId('exp');
      await createExpense({
        id: expenseId,
        itemNumber: 0,
        title: purchaseConfirmItem.title,
        amount: purchaseConfirmItem.estimatedPrice,
        category: (purchaseConfirmItem.category as any) || 'Personal',
        type: purchaseConfirmItem.priority === 'High' ? 'Need' : 'Want',
        paymentMethod: 'Cash',
        date: selectedDate,
        description: `Purchased from Wishlist: ${purchaseConfirmItem.notes || ''}`.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    await markAsPurchased(purchaseConfirmItem.id, expenseId);
    setPurchaseConfirmItem(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Overview Cards */}
      <View style={styles.headerCardsRow}>
        {/* Total Wishlist Budget */}
        <View
          style={[
            styles.headerMetricCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadowColor,
              shadowOpacity: theme.shadowOpacity,
            },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Gift size={16} color="#8B5CF6" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              ACTIVE WISHLIST
            </Text>
          </View>
          <Text style={[styles.metricBigNumber, { color: theme.textPrimary }]}>
            {formatCurrency(stats.totalActiveValue, settings.currency)}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textSecondary }]}>
            {stats.activeCount} planned items ({stats.highPriorityCount} Needs)
          </Text>
        </View>

        {/* Money Saved from Avoided Impulse Purchases */}
        <View
          style={[
            styles.headerMetricCard,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
            },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#10B981' }]}>
              <ShieldCheck size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.metricLabel, { color: isDark ? '#34D399' : '#047857' }]}>
              IMPULSE AVOIDED
            </Text>
          </View>
          <Text style={[styles.metricBigNumber, { color: isDark ? '#34D399' : '#059669' }]}>
            {formatCurrency(stats.totalAvoidedValue, settings.currency)}
          </Text>
          <Text style={[styles.metricSub, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
            {stats.avoidedCount} purchases avoided by waiting!
          </Text>
        </View>
      </View>

      {/* 2. Controls Toolbar: Status Tabs & Add Button */}
      <View
        style={[
          styles.toolbarCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.toolbarTopRow}>
          {/* Status Filters */}
          <HorizontalScrollRow
            edgeToEdge={false}
            gap={6}
            style={{ flex: 1, marginRight: 8 }}
          >
            {[
              { id: 'active', label: `Active (${stats.activeCount})` },
              { id: 'purchased', label: `Bought (${stats.purchasedCount})` },
              { id: 'dropped', label: `Avoided (${stats.avoidedCount})` },
              { id: 'all', label: `All (${items.length})` },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.7}
                  onPress={() => setFilterStatus(tab.id as any)}
                  style={[
                    styles.statusTab,
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                    !active && {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                      active && styles.statusTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </HorizontalScrollRow>

          {/* Add Item Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingItem(null);
              setFormModalOpen(true);
            }}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add to Wishlist</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Priority Filter Row */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <Search size={15} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search wishlist items, categories, notes..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Priority selector */}
          <View style={styles.priorityFilterRow}>
            {(['all', 'High', 'Medium', 'Low'] as const).map((p) => {
              const active = filterPriority === p;
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.7}
                  onPress={() => setFilterPriority(p)}
                  style={[
                    styles.priorityFilterBtn,
                    {
                      backgroundColor: active
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityFilterText,
                      { color: active ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {p === 'all' ? 'All Priorities' : p === 'High' ? 'Need' : p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 3. Wishlist Cards Grid / List */}
      <View style={styles.cardsList}>
        {filteredItems.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Gift size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery ? 'No matching wishlist items' : 'Your wishlist is empty'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              {searchQuery
                ? 'Try adjusting your search query or filters.'
                : 'Take note of things you want to buy later so you never forget and prevent impulse spending.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setEditingItem(null);
                  setFormModalOpen(true);
                }}
                style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
              >
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add First Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredItems.map((item) => {
            const isPurchased = item.status === 'purchased';
            const isDropped = item.status === 'dropped';
            const priorityColor =
              item.priority === 'High'
                ? '#EF4444'
                : item.priority === 'Medium'
                ? '#F59E0B'
                : '#10B981';

            return (
              <View
                key={item.id}
                style={[
                  styles.wishlistCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isPurchased
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.3)'
                        : '#A7F3D0'
                      : isDropped
                      ? 'rgba(150, 150, 150, 0.25)'
                      : theme.border,
                    opacity: isDropped ? 0.75 : 1,
                    shadowColor: theme.shadowColor,
                    shadowOpacity: theme.shadowOpacity,
                  },
                ]}
              >
                {/* Card Top: Priority & Price */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardBadgesRow}>
                    {/* Priority Badge */}
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: `${priorityColor}15`,
                          borderColor: `${priorityColor}40`,
                        },
                      ]}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                      <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                        {item.priority === 'High' ? 'Need' : item.priority}
                      </Text>
                    </View>

                    {/* Category Pill */}
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Tag size={11} color={theme.textMuted} />
                      <Text style={[styles.categoryPillText, { color: theme.textSecondary }]}>
                        {item.category}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    {isPurchased && (
                      <View style={[styles.statusPill, { backgroundColor: '#10B981' }]}>
                        <CheckCircle2 size={11} color="#FFFFFF" />
                        <Text style={styles.statusPillText}>Purchased</Text>
                      </View>
                    )}

                    {isDropped && (
                      <View style={[styles.statusPill, { backgroundColor: '#71717A' }]}>
                        <ShieldCheck size={11} color="#FFFFFF" />
                        <Text style={styles.statusPillText}>Avoided</Text>
                      </View>
                    )}
                  </View>

                  {/* Price Tag */}
                  <Text style={[styles.priceTag, { color: theme.primary }]}>
                    {formatCurrency(item.estimatedPrice, settings.currency)}
                  </Text>
                </View>

                {/* Card Title */}
                <Text
                  style={[
                    styles.cardTitle,
                    { color: theme.textPrimary },
                    (isPurchased || isDropped) && styles.cardTitleCrossed,
                  ]}
                >
                  {item.title}
                </Text>

                {/* Notes / Reason */}
                {item.notes ? (
                  <Text style={[styles.cardNotes, { color: theme.textSecondary }]}>
                    {item.notes}
                  </Text>
                ) : null}

                {/* Metadata Row: Target Date & Link */}
                <View style={styles.metadataRow}>
                  {item.targetDate ? (
                    <View style={styles.metaItem}>
                      <Calendar size={13} color={theme.textMuted} />
                      <Text style={[styles.metaText, { color: theme.textMuted }]}>
                        Target: {item.targetDate}
                      </Text>
                    </View>
                  ) : null}

                  {item.url ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => Linking.openURL(item.url!)}
                      style={styles.linkItem}
                    >
                      <ExternalLink size={13} color="#0EA5E9" />
                      <Text style={[styles.metaText, { color: '#0EA5E9' }]}>
                        View Store Link
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Card Action Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  {/* Status Actions */}
                  {!isPurchased && !isDropped ? (
                    <View style={styles.footerActionsLeft}>
                      {/* Bought It Button */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setPurchaseConfirmItem(item)}
                        style={[styles.buyActionBtn, { backgroundColor: '#10B981' }]}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>I Bought This</Text>
                      </TouchableOpacity>

                      {/* Don't Need It / Dropped */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => markAsDropped(item.id)}
                        style={[
                          styles.skipActionBtn,
                          { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                        ]}
                        accessibilityLabel="Avoided purchase"
                      >
                        <ShieldCheck size={13} color={theme.textSecondary} />
                        <Text style={[styles.skipBtnText, { color: theme.textSecondary }]}>
                          Skip & Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.footerActionsLeft}>
                      {/* Restore Button */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => restoreItem(item.id)}
                        style={[
                          styles.restoreActionBtn,
                          { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                        ]}
                      >
                        <RotateCcw size={13} color={theme.primary} />
                        <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                          Move Back to Active
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Edit & Delete Controls */}
                  <View style={styles.footerActionsRight}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleOpenEdit(item)}
                      style={[
                        styles.iconActionBtn,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                      accessibilityLabel="Edit item"
                    >
                      <Edit2 size={14} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setDeleteConfirmId(item.id)}
                      style={[
                        styles.iconActionBtn,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                      accessibilityLabel="Delete item"
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Form Modal for Creating & Editing */}
      <WishlistFormModal
        visible={formModalOpen}
        item={editingItem}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Wishlist Item?"
        message="Are you sure you want to remove this item from your future wishlist?"
        confirmText="Delete"
        destructive={true}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteItem(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Purchase Conversion Dialog: Add to daily expenses? */}
      <ConfirmDialog
        visible={!!purchaseConfirmItem}
        title="Congratulations on Your Purchase!"
        message={`Would you like to automatically record "${purchaseConfirmItem?.title}" (${formatCurrency(purchaseConfirmItem?.estimatedPrice || 0, settings.currency)}) as an expense in your daily expense ledger?`}
        confirmText="Yes, Record as Expense"
        cancelText="Just Mark Purchased"
        destructive={false}
        onConfirm={() => handleConfirmPurchaseWithExpense(true)}
        onCancel={() => handleConfirmPurchaseWithExpense(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  headerMetricCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metricIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricBigNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  toolbarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  toolbarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTabTextActive: {
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    marginLeft: 6,
  },
  priorityFilterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  priorityFilterText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardsList: {
    gap: 12,
    paddingBottom: 40,
  },
  emptyStateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    cursor: 'pointer' as any,
  },
  wishlistCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  priceTag: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  cardTitleCrossed: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  cardNotes: {
    fontSize: 12,
    lineHeight: 18,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer' as any,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  footerActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    cursor: 'pointer' as any,
  },
  skipActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  restoreActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
});
