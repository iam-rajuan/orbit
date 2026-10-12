import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  CheckSquare,
  Receipt,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { StatCard } from '../../components/common/StatCard';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { formatCurrency } from '../../utils/currency';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { RoutineFormModal } from '../routine/RoutineFormModal';

export const DashboardOverview: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { selectedDate } = useDateStore();
  const { routines, completions, toggleCompletion, getRoutineProgress } = useRoutineStore();
  const { tasks, toggleTaskComplete, getTaskProgress } = useTaskStore();
  const { expenses, getDailySummary } = useExpenseStore();
  const { settings } = useSettingsStore();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  // Dynamic metrics
  const routineProgress = getRoutineProgress(selectedDate);
  const taskProgress = getTaskProgress(selectedDate);
  const expenseSummary = getDailySummary(selectedDate);

  // Day specific items
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const dayExpenses = expenses.filter((e) => e.date === selectedDate);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Statistics Cards Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Routine Progress"
          value={`${routineProgress.completed} / ${routineProgress.total}`}
          subtitle={`${routineProgress.percentage}% completed`}
          progressPercentage={routineProgress.percentage}
          progressColor="#10b981"
          icon={<Clock size={20} color="#10b981" />}
          iconBgColor="#ecfdf5"
          onPress={() => router.push('/routine' as any)}
        />

        <StatCard
          title="Tasks Completed"
          value={`${taskProgress.completed} / ${taskProgress.total}`}
          subtitle={`${taskProgress.percentage}% completed (${taskProgress.pending} pending)`}
          progressPercentage={taskProgress.percentage}
          progressColor="#4F46E5"
          icon={<CheckSquare size={20} color="#4F46E5" />}
          iconBgColor="#EEF2FF"
          onPress={() => router.push('/tasks' as any)}
        />

        <StatCard
          title="Pending Tasks"
          value={`${taskProgress.pending}`}
          subtitle="Remaining for today"
          icon={<AlertCircle size={20} color="#F59E0B" />}
          iconBgColor="#FEF3C7"
          onPress={() => router.push('/tasks' as any)}
        />

        <StatCard
          title="Daily Expenses"
          value={formatCurrency(expenseSummary.total, settings.currency)}
          subtitle={`Need: ${formatCurrency(expenseSummary.needTotal, settings.currency)} • Want: ${formatCurrency(expenseSummary.wantTotal, settings.currency)}`}
          icon={<Receipt size={20} color="#F43F5E" />}
          iconBgColor="#FFF1F2"
          onPress={() => router.push('/expenses' as any)}
        />
      </View>

      {/* 2. Daily Routine Section (Horizontal scrollable or grid timeline) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Clock size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>
                Daily Routine ({routines.length} Habits)
              </Text>
              <Text style={styles.sectionSubtitle}>
                Progress: {routineProgress.completed} / {routineProgress.total} ({routineProgress.percentage}%)
              </Text>
            </View>
          </View>
          <View style={styles.sectionActions}>
            <AppButton
              title="Add Habit"
              variant="outline"
              size="sm"
              icon={<Plus size={14} color="#52525B" />}
              onPress={() => setRoutineModalOpen(true)}
            />
            <AppButton
              title="Full Routine"
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={14} color="#4F46E5" />}
              iconPosition="right"
              onPress={() => router.push('/routine' as any)}
            />
          </View>
        </View>

        {/* Routine items timeline pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routineTimeline}
        >
          {routines.map((routine) => {
            const comp = completions.find(
              (c) => c.date === selectedDate && c.routineId === routine.id
            );
            const isCompleted = !!comp?.completed;

            return (
              <TouchableOpacity
                key={routine.id}
                activeOpacity={0.8}
                onPress={() => toggleCompletion(selectedDate, routine.id)}
                style={[
                  styles.routinePill,
                  isCompleted && styles.routinePillCompleted,
                ]}
              >
                <View style={styles.routinePillTop}>
                  <Text
                    style={[
                      styles.routineTime,
                      isCompleted && styles.routineTimeCompleted,
                    ]}
                  >
                    {routine.time}
                  </Text>
                  <AppCheckbox
                    checked={isCompleted}
                    onToggle={() => toggleCompletion(selectedDate, routine.id)}
                    size={18}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.routineTitle,
                    isCompleted && styles.routineTitleCompleted,
                  ]}
                >
                  {routine.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Two-Column Workspace for Tasks & Expenses Overview */}
      <View style={[styles.dualGrid, isDesktop ? styles.dualGridDesktop : null]}>
        {/* Left Column: Tasks Overview */}
        <View style={styles.gridColumn}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleGroup}>
                <View style={[styles.sectionIconBadge, { backgroundColor: '#EEF2FF' }]}>
                  <CheckSquare size={16} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Daily Tasks</Text>
                  <Text style={styles.sectionSubtitle}>
                    {taskProgress.completed} of {taskProgress.total} completed ({taskProgress.percentage}%)
                  </Text>
                </View>
              </View>
              <View style={styles.sectionActions}>
                <AppButton
                  title="Add Task"
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} color="#ffffff" />}
                  onPress={() => setTaskModalOpen(true)}
                />
                <AppButton
                  title="All Tasks"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/tasks' as any)}
                />
              </View>
            </View>

            {dayTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tasks scheduled for this day.</Text>
                <AppButton
                  title="Create First Task"
                  size="sm"
                  variant="outline"
                  onPress={() => setTaskModalOpen(true)}
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : (
              <View style={styles.taskListContainer}>
                {dayTasks.slice(0, 6).map((task) => (
                  <View
                    key={task.id}
                    style={[
                      styles.taskItemRow,
                      task.completed && styles.taskItemRowCompleted,
                    ]}
                  >
                    <AppCheckbox
                      checked={task.completed}
                      onToggle={() => toggleTaskComplete(task.id)}
                      size={18}
                    />
                    <View style={styles.taskTextWrapper}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.taskTitleText,
                          task.completed && styles.taskTitleTextCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                      <View style={styles.taskMetaRow}>
                        <AppBadge label={task.category} variant="category" size="sm" />
                        <AppBadge
                          label={task.priority}
                          variant="priority"
                          priority={task.priority}
                          size="sm"
                        />
                        {task.projectName && (
                          <Text style={styles.taskProjectText}>
                            📁 {task.projectName}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
                {dayTasks.length > 6 && (
                  <TouchableOpacity
                    style={styles.moreLink}
                    onPress={() => router.push('/tasks' as any)}
                  >
                    <Text style={styles.moreLinkText}>
                      + View {dayTasks.length - 6} more tasks
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Right Column: Expenses Overview */}
        <View style={styles.gridColumn}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleGroup}>
                <View style={[styles.sectionIconBadge, { backgroundColor: '#FFF1F2' }]}>
                  <Receipt size={16} color="#F43F5E" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Daily Expenses</Text>
                  <Text style={styles.sectionSubtitle}>
                    Total: {formatCurrency(expenseSummary.total, settings.currency)} ({expenseSummary.count} items)
                  </Text>
                </View>
              </View>
              <View style={styles.sectionActions}>
                <AppButton
                  title="Add Expense"
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={14} color="#52525B" />}
                  onPress={() => setExpenseModalOpen(true)}
                />
                <AppButton
                  title="All Expenses"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/expenses' as any)}
                />
              </View>
            </View>

            {dayExpenses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses recorded for this day.</Text>
                <AppButton
                  title="Add Expense"
                  size="sm"
                  variant="outline"
                  onPress={() => setExpenseModalOpen(true)}
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : (
              <View style={styles.expenseListContainer}>
                {dayExpenses.slice(0, 6).map((expense) => (
                  <View key={expense.id} style={styles.expenseItemRow}>
                    <View style={styles.expenseLeft}>
                      <Text style={styles.expenseItemTitle}>{expense.title}</Text>
                      <View style={styles.expenseMetaRow}>
                        <AppBadge label={expense.category} variant="category" size="sm" />
                        <AppBadge label={expense.type} variant="expenseType" size="sm" />
                        <Text style={styles.expensePaymentText}>
                          {expense.paymentMethod}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.expenseAmountText}>
                      {formatCurrency(expense.amount, settings.currency)}
                    </Text>
                  </View>
                ))}
                {dayExpenses.length > 6 && (
                  <TouchableOpacity
                    style={styles.moreLink}
                    onPress={() => router.push('/expenses' as any)}
                  >
                    <Text style={styles.moreLinkText}>
                      + View {dayExpenses.length - 6} more expenses
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Modals */}
      <TaskFormModal
        visible={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
      <ExpenseFormModal
        visible={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />
      <RoutineFormModal
        visible={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 18,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 2,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineTimeline: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  routinePill: {
    width: 148,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F4F4F5',
    borderRadius: 14,
    padding: 12,
    cursor: 'pointer' as any,
  },
  routinePillCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  routinePillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routineTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
  },
  routineTimeCompleted: {
    color: '#059669',
  },
  routineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  routineTitleCompleted: {
    color: '#047857',
    textDecorationLine: 'line-through',
  },
  dualGrid: {
    flexDirection: 'column',
    gap: 18,
  },
  dualGridDesktop: {
    flexDirection: 'row',
  },
  gridColumn: {
    flex: 1,
  },
  taskListContainer: {
    gap: 8,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F4F4F5',
    gap: 12,
  },
  taskItemRowCompleted: {
    backgroundColor: '#F4F4F5',
    opacity: 0.7,
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  taskTitleTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taskProjectText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '500',
  },
  expenseListContainer: {
    gap: 8,
  },
  expenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F4F4F5',
  },
  expenseLeft: {
    flex: 1,
  },
  expenseItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  expensePaymentText: {
    fontSize: 11,
    color: '#71717A',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '500',
  },
  expenseAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
    marginLeft: 8,
  },
  moreLink: {
    paddingVertical: 8,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  moreLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
});
