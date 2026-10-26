import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
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
import { AppButton } from '../../components/ui/AppButton';
import { HorizontalScrollRow } from '../../components/ui/HorizontalScrollRow';
import { formatCurrency } from '../../utils/currency';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
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
    getFilteredExpenses,
    getDailySummary,
  } = useExpenseStore();

  const { settings } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredExpenses = getFilteredExpenses(selectedDate);
  const summary = getDailySummary(selectedDate);

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
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.viewSwitchButton,
              activeView === 'expenses' && [
                styles.viewSwitchButtonActive,
                { backgroundColor: theme.surface, borderColor: theme.border },
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
              activeView === 'wishlist' && [
                styles.viewSwitchButtonActive,
                { backgroundColor: theme.surface, borderColor: theme.border },
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
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : '#FFF1F2' },
              ]}
            >
              <Receipt size={20} color="#F43F5E" />
            </View>
            <View>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Daily Expenses</Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                Expenditure tracking for {selectedDate}
              </Text>
            </View>
          </View>
          <AppButton
            title="Add Expense"
            variant="primary"
            size="sm"
            icon={<Plus size={16} color="#ffffff" />}
            onPress={() => {
              setEditingExpense(null);
              setModalOpen(true);
            }}
          />
        </View>

        {/* Financial KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View
            style={[
              styles.kpiBox,
              {
                backgroundColor: isDark ? 'rgba(244,63,94,0.12)' : '#FFF1F2',
                borderColor: isDark ? 'rgba(244,63,94,0.3)' : '#FECDD3',
              },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Daily Total</Text>
            <Text style={[styles.kpiValue, { color: '#F43F5E' }]}>
              {formatCurrency(summary.total, settings.currency)}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textMuted }]}>{summary.count} items recorded</Text>
          </View>

          <View
            style={[
              styles.kpiBox,
              {
                backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
                borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
              },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Needs (Essential)</Text>
            <Text style={[styles.kpiValue, { color: isDark ? '#34D399' : '#047857' }]}>
              {formatCurrency(summary.needTotal, settings.currency)}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
              {summary.total > 0 ? `${Math.round((summary.needTotal / summary.total) * 100)}% of total` : '0%'}
            </Text>
          </View>

          <View
            style={[
              styles.kpiBox,
              {
                backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : '#F5F3FF',
                borderColor: isDark ? 'rgba(124,58,237,0.3)' : '#DDD6FE',
              },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Wants (Discretionary)</Text>
            <Text style={[styles.kpiValue, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>
              {formatCurrency(summary.wantTotal, settings.currency)}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
              {summary.total > 0 ? `${Math.round((summary.wantTotal / summary.total) * 100)}% of total` : '0%'}
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
              backgroundColor: theme.surface,
              borderColor: theme.border,
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
            <View style={[styles.thCell, { width: 45 }]}>
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
            filteredExpenses.map((expense, idx) => (
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
                <View style={[styles.tdCell, { width: 45 }]}>
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
            ))
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
            filteredExpenses.map((expense) => (
              <View
                key={expense.id}
                style={[
                  styles.mobileExpenseCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.mobileCardTop}>
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
            ))
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiBox: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
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
