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
  CheckSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDateStore } from '../../stores/useDateStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppProgressBar } from '../../components/ui/AppProgressBar';
import { TaskFormModal } from './TaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Task } from '../../types';
import { FutureTaskManager } from './FutureTaskManager';

export const TaskManager: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const params = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | null>(null);
  const activeView = selectedTab ?? (params.tab === 'upcoming' ? 'upcoming' : 'today');

  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();
  const {
    searchQuery,
    filterCategory,
    filterStatus,
    selectedTaskIds,
    setSearchQuery,
    setFilterCategory,
    setFilterStatus,
    toggleSelectTask,
    selectAllTasks,
    clearSelection,
    toggleTaskComplete,
    deleteTask,
    bulkComplete,
    bulkDelete,
    getFilteredTasks,
    getTaskProgress,
  } = useTaskStore();

  const { settings } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const filteredTasks = getFilteredTasks(selectedDate);
  const progress = getTaskProgress(selectedDate);

  const allSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  return (
    <View style={styles.rootWrapper}>
      {/* 0. Top View Switcher: Today's Tasks vs Future & Upcoming Tasks */}
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
              activeView === 'today' && [
                styles.viewSwitchButtonActive,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ],
            ]}
            onPress={() => setSelectedTab('today')}
            activeOpacity={0.7}
          >
            <CheckSquare
              size={14}
              color={activeView === 'today' ? '#8B5CF6' : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                {
                  color: activeView === 'today' ? theme.textPrimary : theme.textSecondary,
                  fontWeight: activeView === 'today' ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewSwitchButton,
              activeView === 'upcoming' && [
                styles.viewSwitchButtonActive,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ],
            ]}
            onPress={() => setSelectedTab('upcoming')}
            activeOpacity={0.7}
          >
            <Sparkles
              size={14}
              color={activeView === 'upcoming' ? '#8B5CF6' : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                {
                  color: activeView === 'upcoming' ? theme.textPrimary : theme.textSecondary,
                  fontWeight: activeView === 'upcoming' ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeView === 'upcoming' ? (
        <FutureTaskManager />
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
      {/* 1. Header Card with Metrics */}
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
                { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' },
              ]}
            >
              <CheckSquare size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Daily Tasks</Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                Productivity tasks for {selectedDate}
              </Text>
            </View>
          </View>
          <AppButton
            title="Add Task"
            variant="primary"
            size="sm"
            icon={<Plus size={16} color="#ffffff" />}
            onPress={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
          />
        </View>

        {/* Task progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressPercentText, { color: theme.primary }]}>
              Task Progress: {progress.completed} / {progress.total} completed ({progress.percentage}%)
            </Text>
            <Text style={styles.pendingText}>
              {progress.pending} pending
            </Text>
          </View>
          <AppProgressBar
            progress={progress.percentage}
            color={theme.primary}
            height={10}
          />
        </View>
      </View>

      {/* 2. Search, Filter, and Bulk Action Toolbar */}
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
              placeholder="Search tasks, descriptions, notes, projects..."
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

        {/* Category & Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          <TouchableOpacity
            onPress={() => setFilterStatus('ALL')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterStatus === 'ALL' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterStatus === 'ALL' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterStatus === 'ALL' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('PENDING')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterStatus === 'PENDING' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterStatus === 'PENDING' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterStatus === 'PENDING' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              Pending ({progress.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('COMPLETED')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterStatus === 'COMPLETED' ? theme.primary : theme.surfaceSubtle,
                borderColor: filterStatus === 'COMPLETED' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterStatus === 'COMPLETED' ? '#ffffff' : theme.textSecondary },
              ]}
            >
              Completed ({progress.completed})
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
          {settings.taskCategories.map((cat) => (
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
        </ScrollView>

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedTaskIds.length > 0 && (
          <View
            style={[
              styles.bulkActionBar,
              {
                backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE',
              },
            ]}
          >
            <Text style={[styles.bulkCountText, { color: theme.primary }]}>
              {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
            </Text>
            <View style={styles.bulkButtons}>
              <AppButton
                title="Mark Completed"
                size="sm"
                variant="success"
                icon={<Check size={14} color="#ffffff" />}
                onPress={() => bulkComplete(true)}
              />
              <AppButton
                title="Mark Incomplete"
                size="sm"
                variant="outline"
                onPress={() => bulkComplete(false)}
              />
              <AppButton
                title="Delete Selected"
                size="sm"
                variant="danger"
                icon={<Trash2 size={14} color="#ffffff" />}
                onPress={() => setBulkDeleteConfirmOpen(true)}
              />
              <AppButton
                title="Cancel"
                size="sm"
                variant="ghost"
                onPress={clearSelection}
              />
            </View>
          </View>
        )}
      </View>

      {/* 3. Task List (Desktop Spreadsheet Table vs Mobile Cards) */}
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
            <View style={[styles.thCell, { width: 50 }]}>
              <AppCheckbox
                checked={allSelected}
                onToggle={() => selectAllTasks(selectedDate)}
                size={18}
              />
            </View>
            <View style={[styles.thCell, { width: 110 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Category</Text>
            </View>
            <View style={[styles.thCell, { width: 90 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Type</Text>
            </View>
            <View style={[styles.thCell, { width: 90 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Priority</Text>
            </View>
            <View style={[styles.thCell, { width: 130 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Project / List</Text>
            </View>
            <View style={[styles.thCell, { flex: 1 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Task Description</Text>
            </View>
            <View style={[styles.thCell, { width: 160 }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Notes</Text>
            </View>
            <View style={[styles.thCell, { width: 80, justifyContent: 'flex-end' }]}>
              <Text style={[styles.thText, { color: theme.textMuted }]}>Actions</Text>
            </View>
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No matching tasks found for this day.</Text>
            </View>
          ) : (
            filteredTasks.map((task, idx) => {
              const isSelected = selectedTaskIds.includes(task.id);
              return (
                <View
                  key={task.id}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF')
                        : task.completed
                        ? (isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA')
                        : theme.surface,
                      borderBottomColor: theme.border,
                    },
                    task.completed && styles.tableRowCompleted,
                  ]}
                >
                  <View style={[styles.tdCell, { width: 50, flexDirection: 'row', gap: 6 }]}>
                    <TouchableOpacity
                      onPress={() => toggleSelectTask(task.id)}
                      style={{ opacity: 0.6 }}
                    >
                      <View
                        style={[
                          styles.smallBox,
                          { borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                      />
                    </TouchableOpacity>
                    <AppCheckbox
                      checked={task.completed}
                      onToggle={() => toggleTaskComplete(task.id)}
                      size={18}
                    />
                  </View>

                  <View style={[styles.tdCell, { width: 110 }]}>
                    <AppBadge label={task.category} variant="category" size="sm" />
                  </View>

                  <View style={[styles.tdCell, { width: 90 }]}>
                    <Text style={[styles.tdTextMuted, { color: theme.textSecondary }]}>{task.type}</Text>
                  </View>

                  <View style={[styles.tdCell, { width: 90 }]}>
                    <AppBadge
                      label={task.priority}
                      variant="priority"
                      priority={task.priority}
                      size="sm"
                    />
                  </View>

                  <View style={[styles.tdCell, { width: 130 }]}>
                    <Text style={[styles.tdTextBold, { color: theme.textPrimary }]} numberOfLines={1}>
                      {task.projectName || '—'}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.tdTextTitle,
                        { color: theme.textPrimary },
                        task.completed && styles.tdTextCompleted,
                      ]}
                    >
                      {task.description || task.title}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { width: 160 }]}>
                    <Text style={[styles.tdTextNotes, { color: theme.textMuted }]} numberOfLines={2}>
                      {task.notes || '—'}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { width: 80, justifyContent: 'flex-end', flexDirection: 'row', gap: 6 }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5' }]}
                    >
                      <Edit2 size={15} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setDeleteConfirmId(task.id)}
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' }]}
                    >
                      <Trash2 size={15} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : (
        /* Mobile Card View */
        <View style={styles.mobileCardList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No matching tasks found.</Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              return (
                <View
                  key={task.id}
                  style={[
                    styles.mobileTaskCard,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF')
                        : task.completed
                        ? (isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA')
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                    task.completed && styles.mobileTaskCardCompleted,
                  ]}
                >
                  <View style={styles.mobileCardTop}>
                    <AppCheckbox
                      checked={task.completed}
                      onToggle={() => toggleTaskComplete(task.id)}
                      size={20}
                    />
                    <View style={styles.mobileBadgeGroup}>
                      <AppBadge label={task.category} variant="category" size="sm" />
                      <AppBadge
                        label={task.priority}
                        variant="priority"
                        priority={task.priority}
                        size="sm"
                      />
                    </View>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingTask(task);
                          setModalOpen(true);
                        }}
                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5' }]}
                      >
                        <Edit2 size={15} color={theme.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDeleteConfirmId(task.id)}
                        style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#FFF1F2' }]}
                      >
                        <Trash2 size={15} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.mobileTaskTitle,
                      { color: theme.textPrimary },
                      task.completed && styles.mobileTaskTitleCompleted,
                    ]}
                  >
                    {task.description || task.title}
                  </Text>

                  <View style={styles.mobileCardMeta}>
                    {task.projectName && (
                      <Text style={[styles.mobileProjectText, { color: theme.textSecondary }]}>
                        📁 {task.projectName} • {task.type}
                      </Text>
                    )}
                    {task.notes ? (
                      <Text style={[styles.mobileNotesText, { color: theme.textMuted }]}>
                        Note: {task.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
      />

      {/* Single Delete Confirm */}
      <ConfirmDialog
        visible={!!deleteConfirmId}
        title="Delete Task"
        message="Are you sure you want to delete this task record?"
        onConfirm={async () => {
          if (deleteConfirmId) {
            await deleteTask(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        visible={bulkDeleteConfirmOpen}
        title="Delete Selected Tasks"
        message={`Are you sure you want to delete ${selectedTaskIds.length} selected task(s)? This action cannot be undone.`}
        onConfirm={async () => {
          await bulkDelete();
          setBulkDeleteConfirmOpen(false);
        }}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
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
    paddingTop: 8,
    paddingBottom: 2,
  },
  viewSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    height: 38,
    alignItems: 'center',
  },
  viewSwitchButton: {
    flex: 1,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  viewSwitchButtonActive: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewSwitchText: {
    fontSize: 13,
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
  progressSection: {
    gap: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
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
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bulkButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  tableRowCompleted: {
    opacity: 0.75,
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tdTextBold: {
    fontSize: 13,
    fontWeight: '600',
  },
  tdTextTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  tdTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  tdTextMuted: {
    fontSize: 12,
  },
  tdTextNotes: {
    fontSize: 12,
  },
  smallBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
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
  mobileTaskCard: {
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
  mobileTaskCardCompleted: {
    opacity: 0.75,
  },
  mobileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginLeft: 8,
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  mobileTaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  mobileCardMeta: {
    gap: 3,
  },
  mobileProjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mobileNotesText: {
    fontSize: 11,
  },
});
