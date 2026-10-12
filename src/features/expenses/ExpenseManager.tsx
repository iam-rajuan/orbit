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
  Wallet,
  PieChart,
  X,
  CreditCard,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { formatCurrency } from '../../utils/currency';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Expense } from '../../types';

export const ExpenseManager: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const { selectedDate } = useDateStore();
  const {
    searchQuery,
    filterCategory,
    filterType,
    filterPayment,
    setSearchQuery,
    setFilterCategory,
    setFilterType,
    setFilterPayment,
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Card with Daily Financial Metrics */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF1F2' }]}>
              <Receipt size={20} color="#F43F5E" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Daily Expenses</Text>
              <Text style={styles.pageSubtitle}>
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
          <View style={[styles.kpiBox, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
            <Text style={styles.kpiLabel}>Daily Total</Text>
            <Text style={[styles.kpiValue, { color: '#BE123C' }]}>
              {formatCurrency(summary.total, settings.currency)}
            </Text>
            <Text style={styles.kpiSub}>{summary.count} items recorded</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Text style={styles.kpiLabel}>Needs (Essential)</Text>
            <Text style={[styles.kpiValue, { color: '#047857' }]}>
              {formatCurrency(summary.needTotal, settings.currency)}
            </Text>
            <Text style={styles.kpiSub}>
              {summary.total > 0 ? `${Math.round((summary.needTotal / summary.total) * 100)}% of total` : '0%'}
            </Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
            <Text style={styles.kpiLabel}>Wants (Discretionary)</Text>
            <Text style={[styles.kpiValue, { color: '#7C3AED' }]}>
              {formatCurrency(summary.wantTotal, settings.currency)}
            </Text>
            <Text style={styles.kpiSub}>
              {summary.total > 0 ? `${Math.round((summary.wantTotal / summary.total) * 100)}% of total` : '0%'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Search & Filter Bar */}
      <View style={styles.toolbarCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color="#71717A" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search expenses, notes, categories..."
              placeholderTextColor="#A1A1AA"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#71717A" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Type and Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          <TouchableOpacity
            onPress={() => setFilterType('ALL')}
            style={[styles.filterPill, filterType === 'ALL' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterType === 'ALL' && styles.filterPillTextActive]}>
              All Types
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterType('Need')}
            style={[styles.filterPill, filterType === 'Need' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterType === 'Need' && styles.filterPillTextActive]}>
              Need
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterType('Want')}
            style={[styles.filterPill, filterType === 'Want' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterType === 'Want' && styles.filterPillTextActive]}>
              Want
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => setFilterCategory('ALL')}
            style={[styles.filterPill, filterCategory === 'ALL' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterCategory === 'ALL' && styles.filterPillTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {settings.expenseCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilterCategory(cat === filterCategory ? 'ALL' : cat)}
              style={[styles.filterPill, filterCategory === cat && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, filterCategory === cat && styles.filterPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Expense List (Desktop Spreadsheet Table vs Mobile Cards) */}
      {isDesktop ? (
        /* Desktop Compact Table */
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <View style={[styles.thCell, { width: 45 }]}>
              <Text style={styles.thText}>#</Text>
            </View>
            <View style={[styles.thCell, { width: 120 }]}>
              <Text style={styles.thText}>Category</Text>
            </View>
            <View style={[styles.thCell, { width: 100 }]}>
              <Text style={styles.thText}>Payment</Text>
            </View>
            <View style={[styles.thCell, { width: 85 }]}>
              <Text style={styles.thText}>Type</Text>
            </View>
            <View style={[styles.thCell, { flex: 1.2 }]}>
              <Text style={styles.thText}>Expense Item</Text>
            </View>
            <View style={[styles.thCell, { flex: 1.5 }]}>
              <Text style={styles.thText}>Notes / Description</Text>
            </View>
            <View style={[styles.thCell, { width: 120, justifyContent: 'flex-end' }]}>
              <Text style={styles.thText}>Amount ({settings.currency})</Text>
            </View>
            <View style={[styles.thCell, { width: 80, justifyContent: 'flex-end' }]}>
              <Text style={styles.thText}>Actions</Text>
            </View>
          </View>

          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyText}>No expenses found for this date.</Text>
            </View>
          ) : (
            filteredExpenses.map((expense, idx) => (
              <View
                key={expense.id}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowEven]}
              >
                <View style={[styles.tdCell, { width: 45 }]}>
                  <Text style={styles.tdTextMuted}>{expense.itemNumber || idx + 1}</Text>
                </View>

                <View style={[styles.tdCell, { width: 120 }]}>
                  <AppBadge label={expense.category} variant="category" size="sm" />
                </View>

                <View style={[styles.tdCell, { width: 100 }]}>
                  <Text style={styles.tdTextPayment}>{expense.paymentMethod}</Text>
                </View>

                <View style={[styles.tdCell, { width: 85 }]}>
                  <AppBadge label={expense.type} variant="expenseType" size="sm" />
                </View>

                <View style={[styles.tdCell, { flex: 1.2 }]}>
                  <Text style={styles.tdTextTitle}>{expense.title}</Text>
                </View>

                <View style={[styles.tdCell, { flex: 1.5 }]}>
                  <Text style={styles.tdTextNotes} numberOfLines={2}>
                    {expense.description || '—'}
                  </Text>
                </View>

                <View style={[styles.tdCell, { width: 120, justifyContent: 'flex-end' }]}>
                  <Text style={styles.tdTextAmount}>
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
                    style={styles.actionBtn}
                  >
                    <Edit2 size={15} color="#71717A" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDeleteConfirmId(expense.id)}
                    style={styles.actionBtn}
                  >
                    <Trash2 size={15} color="#F43F5E" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Table Footer with Total */}
          <View style={styles.tableFooter}>
            <Text style={styles.tableFooterLabel}>Total Daily Expenses</Text>
            <Text style={styles.tableFooterCount}>
              {summary.count} items recorded
            </Text>
            <Text style={styles.tableFooterTotal}>
              {formatCurrency(summary.total, settings.currency)}
            </Text>
          </View>
        </View>
      ) : (
        /* Mobile Card View */
        <View style={styles.mobileCardList}>
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyText}>No expenses recorded for this day.</Text>
            </View>
          ) : (
            filteredExpenses.map((expense) => (
              <View key={expense.id} style={styles.mobileExpenseCard}>
                <View style={styles.mobileCardTop}>
                  <View style={styles.mobileBadges}>
                    <AppBadge label={expense.category} variant="category" size="sm" />
                    <AppBadge label={expense.type} variant="expenseType" size="sm" />
                    <Text style={styles.mobilePayment}>{expense.paymentMethod}</Text>
                  </View>
                  <View style={styles.mobileActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingExpense(expense);
                        setModalOpen(true);
                      }}
                      style={styles.actionBtn}
                    >
                      <Edit2 size={15} color="#71717A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteConfirmId(expense.id)}
                      style={styles.actionBtn}
                    >
                      <Trash2 size={15} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.mobileCardMiddle}>
                  <Text style={styles.mobileTitle}>{expense.title}</Text>
                  <Text style={styles.mobileAmount}>
                    {formatCurrency(expense.amount, settings.currency)}
                  </Text>
                </View>

                {expense.description ? (
                  <Text style={styles.mobileDesc}>{expense.description}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 20,
    shadowColor: '#18181B',
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
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
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
    color: '#71717A',
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
    color: '#71717A',
    marginTop: 4,
  },
  toolbarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 14,
    gap: 10,
    shadowColor: '#18181B',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F4F4F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181B',
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
    backgroundColor: '#F4F4F5',
    cursor: 'pointer' as any,
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#E4E4E7',
    marginHorizontal: 4,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    overflow: 'hidden',
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
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
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    backgroundColor: '#ffffff',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tdTextMuted: {
    fontSize: 12,
    color: '#71717A',
  },
  tdTextPayment: {
    fontSize: 12,
    color: '#52525B',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  tdTextTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  tdTextNotes: {
    fontSize: 12,
    color: '#71717A',
  },
  tdTextAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18181B',
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableFooterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  tableFooterCount: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  tableFooterTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
  },
  actionBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    cursor: 'pointer' as any,
  },
  emptyTable: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  mobileCardList: {
    gap: 10,
  },
  mobileExpenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 14,
    gap: 10,
    shadowColor: '#18181B',
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
    color: '#52525B',
    backgroundColor: '#F4F4F5',
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
    color: '#18181B',
    flex: 1,
  },
  mobileAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    marginLeft: 8,
  },
  mobileDesc: {
    fontSize: 12,
    color: '#71717A',
  },
});
