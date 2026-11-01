import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Platform,
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
import { SortableList } from '../../components/ui/SortableList';
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
    reorderWishlistItems,
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
      {/* 1. Header Card with Wishlist Overview Metrics */}
      <View
        style={[
          styles.overviewCard,
          {
            backgroundColor: isDark ? 'rgba(24, 24, 28, 0.76)' : 'rgba(255, 255, 255, 0.88)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: theme.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 14,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(24px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                } as any)
              : {}),
          },
        ]}
      >
        {/* Top Header Row: Icon + Title/Subtitle on Left | + Wishlist Button on Right */}
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : '#F3E8FF' },
              ]}
            >
              <Gift size={17} color="#8B5CF6" strokeWidth={2.4} />
            </View>
            <View style={styles.titleTextCol}>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Wishlist & Later
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                Curated purchases & impulse control
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingItem(null);
              setFormModalOpen(true);
            }}
            style={[styles.addWishlistBtn, { backgroundColor: '#8B5CF6' }]}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.addWishlistBtnText}>Wishlist</Text>
          </TouchableOpacity>
        </View>

        {/* Dual Metric Tiles: Active Planned & Impulse Saved */}
        <View style={styles.metricsRow}>
          {/* Active Planned Tile */}
          <View
            style={[
              styles.metricTile,
              {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)',
                borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.18)',
              },
            ]}
          >
            <View style={styles.metricTileHeader}>
              <View style={[styles.metricTileDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={[styles.metricTileLabel, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
                ACTIVE PLANNED
              </Text>
            </View>
            <Text style={[styles.metricTileAmount, { color: isDark ? '#EDE9FE' : '#6D28D9' }]}>
              {formatCurrency(stats.totalActiveValue, settings.currency)}
            </Text>
            <Text style={[styles.metricTileSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {stats.activeCount} planned ({stats.highPriorityCount} Need)
            </Text>
          </View>

          {/* Impulse Avoided Tile */}
          <View
            style={[
              styles.metricTile,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.18)',
              },
            ]}
          >
            <View style={styles.metricTileHeader}>
              <View style={[styles.metricTileDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.metricTileLabel, { color: isDark ? '#6EE7B7' : '#059669' }]}>
                IMPULSE SAVED
              </Text>
            </View>
            <Text style={[styles.metricTileAmount, { color: isDark ? '#34D399' : '#059669' }]}>
              {formatCurrency(stats.totalAvoidedValue, settings.currency)}
            </Text>
            <Text style={[styles.metricTileSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {stats.avoidedCount} avoided by waiting
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Controls Toolbar: Status Tabs */}
      <View
        style={[
          styles.toolbarCard,
          {
            backgroundColor: isDark ? 'rgba(24, 24, 28, 0.78)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                } as any)
              : {}),
          },
        ]}
      >
        <View style={styles.toolbarTopRow}>
          {/* Status Filters */}
          <HorizontalScrollRow
            edgeToEdge={false}
            gap={6}
            style={{ flex: 1 }}
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
          <SortableList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            onReorder={reorderWishlistItems}
            renderItem={({ item }) => {
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
                      backgroundColor: isPurchased
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.14)'
                          : 'rgba(236, 253, 245, 0.85)'
                        : isDropped
                        ? isDark
                          ? 'rgba(24, 24, 28, 0.5)'
                          : 'rgba(244, 244, 245, 0.7)'
                        : isDark
                        ? 'rgba(24, 24, 28, 0.78)'
                        : 'rgba(255, 255, 255, 0.85)',
                      borderColor: isPurchased
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.35)'
                          : '#A7F3D0'
                        : isDropped
                        ? 'rgba(150, 150, 150, 0.25)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(255, 255, 255, 0.7)',
                      opacity: isDropped ? 0.75 : 1,
                      shadowColor: theme.shadowColor,
                      shadowOpacity: theme.shadowOpacity,
                      ...(Platform.OS === 'web'
                        ? ({
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                          } as any)
                        : {}),
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
          }}
        />
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
  overviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  addWishlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    flexShrink: 0,
    cursor: 'pointer' as any,
  },
  addWishlistBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  metricTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  metricTileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricTileLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  metricTileAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricTileSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  toolbarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  toolbarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statusTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
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
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 9999,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
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
    borderRadius: 20,
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
    borderRadius: 9999,
    marginTop: 10,
    cursor: 'pointer' as any,
  },
  wishlistCard: {
    borderRadius: 18,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
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
