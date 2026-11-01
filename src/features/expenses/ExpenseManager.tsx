import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Platform,
} from 'react-native';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Gift,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDateStore } from '../../stores/useDateStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppBadge } from '../../components/ui/AppBadge';
import { HorizontalScrollRow } from '../../components/ui/HorizontalScrollRow';
import { formatCurrency } from '../../utils/currency';
import { formatAdaptiveDate } from '../../utils/date';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SortableList } from '../../components/ui/SortableList';
import { Expense } from '../../types';
import { WishlistManager } from '../wishlist/WishlistManager';

export const ExpenseManager: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isMobile = width < 500;

  const params = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<'expenses' | 'wishlist' | null>(null);
  const activeView = selectedTab ?? (params.tab === 'wishlist' ? 'wishlist' : 'expenses');

  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();
  const {
    searchQuery,
    filterCategory,
    filterType,
    setSearchQuery,
    setFilterCategory,
    setFilterType,
    deleteExpense,
    reorderExpenses,
    getFilteredExpenses,
    getDailySummary,
  } = useExpenseStore();

  const { settings } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredExpenses = getFilteredExpenses(selectedDate);
  const summary = getDailySummary(selectedDate);
  const needPercent = summary.total > 0 ? Math.round((summary.needTotal / summary.total) * 100) : 0;
  const wantPercent = summary.total > 0 ? Math.round((summary.wantTotal / summary.total) * 100) : 0;

  return (
    <View style={styles.rootWrapper}>
      {/* 0. Top View Switcher: Daily Expenses vs Wishlist & Buy Later */}
      <View
        style={[
          styles.topBarWrapper,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <View
          style={[
            styles.viewSwitchContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderRadius: 9999,
              padding: 4,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.viewSwitchButton,
              { borderRadius: 9999 },
              activeView === 'expenses' && [
                styles.viewSwitchButtonActive,
                {
                  backgroundColor: isDark ? 'rgba(40, 40, 46, 0.9)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                  borderRadius: 9999,
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                },
              ],
            ]}
            onPress={() => setSelectedTab('expenses')}
            activeOpacity={0.7}
          >
            <Receipt
              size={15}
              color={activeView === 'expenses' ? '#F43F5E' : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                {
                  color: activeView === 'expenses' ? theme.textPrimary : theme.textSecondary,
                  fontWeight: activeView === 'expenses' ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              Daily Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewSwitchButton,
              { borderRadius: 9999 },
              activeView === 'wishlist' && [
                styles.viewSwitchButtonActive,
                {
                  backgroundColor: isDark ? 'rgba(40, 40, 46, 0.9)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                  borderRadius: 9999,
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                },
              ],
            ]}
            onPress={() => setSelectedTab('wishlist')}
            activeOpacity={0.7}
          >
            <Gift
              size={15}
              color={activeView === 'wishlist' ? '#EC4899' : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                {
                  color: activeView === 'wishlist' ? theme.textPrimary : theme.textSecondary,
                  fontWeight: activeView === 'wishlist' ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {isMobile ? 'Wishlist & Later' : 'Wishlist & Buy Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeView === 'wishlist' ? (
        <WishlistManager />
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
      {/* 1. Header Card with Daily Financial Metrics */}
      <View
        style={[
          styles.headerCard,
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
        {/* Top Header Row: Icon + Title/Subtitle on Left | + Expense Button on Right */}
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.16)' : '#FFF1F2' },
              ]}
            >
              <Receipt size={19} color="#F43F5E" strokeWidth={2.4} />
            </View>
            <View style={styles.titleTextCol}>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Daily Expenses
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {formatAdaptiveDate(selectedDate, 'medium')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingExpense(null);
              setModalOpen(true);
            }}
            style={[styles.addExpenseBtn, { backgroundColor: '#F43F5E' }]}
            accessibilityLabel="Add new expense"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.addExpenseBtnText}>Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Daily Total Row */}
        <View style={styles.heroTotalRow}>
          <View>
            <Text style={[styles.heroTotalLabel, { color: theme.textMuted }]}>
              DAILY TOTAL
            </Text>
            <Text style={[styles.heroTotalAmount, { color: '#F43F5E' }]}>
              {formatCurrency(summary.total, settings.currency)}
            </Text>
          </View>
          <View
            style={[
              styles.itemsCountBadge,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
          >
            <Text style={[styles.itemsCountBadgeText, { color: theme.textSecondary }]}>
              {summary.count} {summary.count === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        {/* Proportional Split Meter (Needs vs Wants) */}
        {summary.total > 0 && (
          <View style={[styles.meterTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.meterSegment,
                {
                  flex: Math.max(1, needPercent),
                  backgroundColor: '#10B981',
                },
              ]}
            />
            <View
              style={[
                styles.meterSegment,
                {
                  flex: Math.max(1, wantPercent),
                  backgroundColor: '#8B5CF6',
                },
              ]}
            />
          </View>
        )}

        {/* Needs & Wants Breakdown Cards (Side-by-Side) */}
        <View style={styles.breakdownRow}>
          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.28)' : '#A7F3D0',
              },
            ]}
          >
            <View style={styles.breakdownCardHeader}>
              <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.breakdownCardTitle, { color: isDark ? '#34D399' : '#065F46' }]}>
                Needs
              </Text>
              <Text style={[styles.breakdownCardPercent, { color: isDark ? '#34D399' : '#059669' }]}>
                {needPercent}%
              </Text>
            </View>
            <Text
              style={[styles.breakdownCardValue, { color: isDark ? '#E6FFFA' : '#047857' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(summary.needTotal, settings.currency)}
            </Text>
          </View>

          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF',
                borderColor: isDark ? 'rgba(139, 92, 246, 0.28)' : '#DDD6FE',
              },
            ]}
          >
            <View style={styles.breakdownCardHeader}>
              <View style={[styles.breakdownDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={[styles.breakdownCardTitle, { color: isDark ? '#C4B5FD' : '#5B21B6' }]}>
                Wants
              </Text>
              <Text style={[styles.breakdownCardPercent, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
                {wantPercent}%
              </Text>
            </View>
            <Text
              style={[styles.breakdownCardValue, { color: isDark ? '#F5F3FF' : '#6D28D9' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(summary.wantTotal, settings.currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Search & Filter Bar */}
      <View
        style={[
          styles.toolbarCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search expenses, notes, categories..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Type and Category Filter Pills */}
        <HorizontalScrollRow
          edgeToEdge={false}
          gap={6}
          style={{ paddingTop: 4 }}
        >
          <TouchableOpacity
            onPress={() => setFilterType('ALL')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterType === 'ALL' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterType === 'ALL' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterType === 'ALL' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              All Types
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterType('Need')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterType === 'Need' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterType === 'Need' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterType === 'Need' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              Need
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterType('Want')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterType === 'Want' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterType === 'Want' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterType === 'Want' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              Want
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            onPress={() => setFilterCategory('ALL')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterCategory === 'ALL' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterCategory === 'ALL' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterCategory === 'ALL' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>
          {settings.expenseCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilterCategory(cat === filterCategory ? 'ALL' : cat)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filterCategory === cat ? theme.primary : theme.surfaceSubtle,
                  borderColor: filterCategory === cat ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: filterCategory === cat ? '#ffffff' : theme.textSecondary },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </HorizontalScrollRow>
      </View>

      {/* 3. Expense List (Desktop Spreadsheet Table vs Mobile Cards) */}
      {isDesktop ? (
        /* Desktop Compact Table */
        <View
          style={[
            styles.tableCard,
            {
              backgroundColor: isDark ? 'rgba(22, 22, 26, 0.75)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: 20,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(24px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                  } as any)
                : {}),
            },
          ]}
        >
          <View
            style={[
              styles.tableHeader,
              {
                backgroundColor: theme.surfaceSubtle,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={[styles.thCell, { width: 56 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>#</Text>
            </View>
            <View style={[styles.thCell, { width: 120 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Category</Text>
            </View>
            <View style={[styles.thCell, { width: 100 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Payment</Text>
            </View>
            <View style={[styles.thCell, { width: 85 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Type</Text>
            </View>
            <View style={[styles.thCell, { flex: 1.2 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Expense Item</Text>
            </View>
            <View style={[styles.thCell, { flex: 1.5 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Notes / Description</Text>
            </View>
            <View style={[styles.thCell, { width: 120, justifyContent: 'flex-end' }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Amount ({settings.currency})</Text>
            </View>
            <View style={[styles.thCell, { width: 80, justifyContent: 'flex-end' }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Actions</Text>
            </View>
          </View>

          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No expenses found for this date.</Text>
            </View>
          ) : (
            <SortableList
              data={filteredExpenses}
              keyExtractor={(expense) => expense.id}
              onReorder={reorderExpenses}
              renderItem={({ item: expense, index: idx }) => (
                <View
                  key={expense.id}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: theme.surface,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={[styles.tdCell, { width: 44, flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={[styles.tdTextMuted, { color: theme.textMuted }]}>{expense.itemNumber || idx + 1}</Text>
                  </View>

                  <View style={[styles.tdCell, { width: 120 }]}>
                    <AppBadge label={expense.category} variant="category" size="sm" />
                  </View>

                  <View style={[styles.tdCell, { width: 100 }]}>
                    <Text
                      style={[
                        styles.tdTextPayment,
                        {
                          backgroundColor: theme.surfaceSubtle,
                          color: theme.textSecondary,
                        },
                      ]}
                    >
                      {expense.paymentMethod}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { width: 85 }]}>
                    <AppBadge label={expense.type} variant="expenseType" size="sm" />
                  </View>

                  <View style={[styles.tdCell, { flex: 1.2 }]}>
                    <Text style={[styles.tdTextTitle, { color: theme.textPrimary }]}>{expense.title}</Text>
                  </View>

                  <View style={[styles.tdCell, { flex: 1.5 }]}>
                    <Text style={[styles.tdTextNotes, { color: theme.textSecondary }]} numberOfLines={2}>
                      {expense.description || '—'}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { width: 120, justifyContent: 'flex-end' }]}>
                    <Text style={[styles.tdTextAmount, { color: theme.textPrimary }]}>
                      {formatCurrency(expense.amount, settings.currency)}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { width: 80, justifyContent: 'flex-end', flexDirection: 'row', gap: 6 }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setEditingExpense(expense);
                        setModalOpen(true);
                      }}
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5' }]}
                    >
                      <Edit2 size={15} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setDeleteConfirmId(expense.id)}
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' }]}
                    >
                      <Trash2 size={15} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* Table Footer with Total */}
          <View
            style={[
              styles.tableFooter,
              {
                backgroundColor: theme.surfaceSubtle,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.tableFooterLabel, { color: theme.textPrimary }]}>Total Daily Expenses</Text>
            <Text style={[styles.tableFooterCount, { color: theme.textMuted }]}>
              {summary.count} items recorded
            </Text>
            <Text style={[styles.tableFooterTotal, { color: theme.primary }]}>
              {formatCurrency(summary.total, settings.currency)}
            </Text>
          </View>
        </View>
      ) : (
        /* Mobile Card View */
        <View style={styles.mobileCardList}>
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No expenses recorded for this day.</Text>
            </View>
          ) : (
            <SortableList
              data={filteredExpenses}
              keyExtractor={(expense) => expense.id}
              onReorder={reorderExpenses}
              renderItem={({ item: expense }) => (
                <View
                  key={expense.id}
                  style={[
                    styles.mobileExpenseCard,
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
                  <View style={styles.mobileCardTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                      <View style={styles.mobileBadges}>
                        <AppBadge label={expense.category} variant="category" size="sm" />
                        <AppBadge label={expense.type} variant="expenseType" size="sm" />
                        <Text
                          style={[
                            styles.mobilePayment,
                            {
                              backgroundColor: theme.surfaceSubtle,
                              color: theme.textSecondary,
                            },
                          ]}
                        >
                          {expense.paymentMethod}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingExpense(expense);
                          setModalOpen(true);
                        }}
                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5' }]}
                      >
                        <Edit2 size={15} color={theme.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDeleteConfirmId(expense.id)}
                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' }]}
                      >
                        <Trash2 size={15} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.mobileCardMiddle}>
                    <Text style={[styles.mobileTitle, { color: theme.textPrimary }]}>{expense.title}</Text>
                    <Text style={[styles.mobileAmount, { color: theme.textPrimary }]}>
                      {formatCurrency(expense.amount, settings.currency)}
                    </Text>
                  </View>

                  {expense.description ? (
                    <Text style={[styles.mobileDesc, { color: theme.textSecondary }]}>{expense.description}</Text>
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Expense Modal */}
      <ExpenseFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        expenseToEdit={editingExpense}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Expense"
        message="Are you sure you want to remove this expense record?"
        onConfirm={async () => {
          if (deleteConfirmId) {
            await deleteExpense(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  topBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  viewSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  viewSwitchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 9,
  },
  viewSwitchButtonActive: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewSwitchText: {
    fontSize: 12.5,
    flexShrink: 1,
  },
  container: {
    padding: 20,
    gap: 18,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  titleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  heroTotalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  heroTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  itemsCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  itemsCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meterTrack: {
    height: 6,
    borderRadius: 9999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  meterSegment: {
    height: '100%',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  breakdownCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  breakdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  breakdownCardPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownCardValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  toolbarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 18,
    marginHorizontal: 4,
  },
  tableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  thCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tdTextMuted: {
    fontSize: 12,
  },
  tdTextPayment: {
    fontSize: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  tdTextTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  tdTextNotes: {
    fontSize: 12,
  },
  tdTextAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableFooterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableFooterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  tableFooterTotal: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtn: {
    padding: 7,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  emptyTable: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  mobileCardList: {
    gap: 10,
  },
  mobileExpenseCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  mobileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mobilePayment: {
    fontSize: 11,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '500',
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileCardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  mobileAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  mobileDesc: {
    fontSize: 12,
  },
});
