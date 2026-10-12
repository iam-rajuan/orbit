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
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { AppCheckbox } from '../../components/ui/AppCheckbox';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppProgressBar } from '../../components/ui/AppProgressBar';
import { TaskFormModal } from './TaskFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Task } from '../../types';

export const TaskManager: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const { selectedDate } = useDateStore();
  const {
    tasks,
    searchQuery,
    filterCategory,
    filterPriority,
    filterStatus,
    selectedTaskIds,
    setSearchQuery,
    setFilterCategory,
    setFilterPriority,
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Card with Metrics */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <View style={styles.iconCircle}>
              <CheckSquare size={20} color="#4f46e5" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Daily Tasks</Text>
              <Text style={styles.pageSubtitle}>
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
            <Text style={styles.progressPercentText}>
              Task Progress: {progress.completed} / {progress.total} completed ({progress.percentage}%)
            </Text>
            <Text style={styles.pendingText}>
              {progress.pending} pending
            </Text>
          </View>
          <AppProgressBar
            progress={progress.percentage}
            color="#4f46e5"
            height={10}
          />
        </View>
      </View>

      {/* 2. Search, Filter, and Bulk Action Toolbar */}
      <View style={styles.toolbarCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color="#71717A" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search tasks, descriptions, notes, projects..."
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

        {/* Category & Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          <TouchableOpacity
            onPress={() => setFilterStatus('ALL')}
            style={[styles.filterPill, filterStatus === 'ALL' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterStatus === 'ALL' && styles.filterPillTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('PENDING')}
            style={[styles.filterPill, filterStatus === 'PENDING' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterStatus === 'PENDING' && styles.filterPillTextActive]}>
              Pending ({progress.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('COMPLETED')}
            style={[styles.filterPill, filterStatus === 'COMPLETED' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterStatus === 'COMPLETED' && styles.filterPillTextActive]}>
              Completed ({progress.completed})
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
          {settings.taskCategories.map((cat) => (
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

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedTaskIds.length > 0 && (
          <View style={styles.bulkActionBar}>
            <Text style={styles.bulkCountText}>
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
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <View style={[styles.thCell, { width: 50 }]}>
              <AppCheckbox
                checked={allSelected}
                onToggle={() => selectAllTasks(selectedDate)}
                size={18}
              />
            </View>
            <View style={[styles.thCell, { width: 110 }]}>
              <Text style={styles.thText}>Category</Text>
            </View>
            <View style={[styles.thCell, { width: 90 }]}>
              <Text style={styles.thText}>Type</Text>
            </View>
            <View style={[styles.thCell, { width: 90 }]}>
              <Text style={styles.thText}>Priority</Text>
            </View>
            <View style={[styles.thCell, { width: 130 }]}>
              <Text style={styles.thText}>Project / List</Text>
            </View>
            <View style={[styles.thCell, { flex: 1 }]}>
              <Text style={styles.thText}>Task Description</Text>
            </View>
            <View style={[styles.thCell, { width: 160 }]}>
              <Text style={styles.thText}>Notes</Text>
            </View>
            <View style={[styles.thCell, { width: 80, justifyContent: 'flex-end' }]}>
              <Text style={styles.thText}>Actions</Text>
            </View>
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyText}>No matching tasks found for this day.</Text>
            </View>
          ) : (
            filteredTasks.map((task, idx) => {
              const isSelected = selectedTaskIds.includes(task.id);
              return (
                <View
                  key={task.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 && styles.tableRowEven,
                    task.completed && styles.tableRowCompleted,
                    isSelected && styles.tableRowSelected,
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
                          isSelected && styles.smallBoxSelected,
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
                    <Text style={styles.tdTextMuted}>{task.type}</Text>
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
                    <Text style={styles.tdTextBold} numberOfLines={1}>
                      {task.projectName || '—'}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.tdTextTitle,
                        task.completed && styles.tdTextCompleted,
                      ]}
                    >
                      {task.description || task.title}
                    </Text>
                  </View>

                  <View style={[styles.tdCell, { width: 160 }]}>
                    <Text style={styles.tdTextNotes} numberOfLines={2}>
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
                      style={styles.actionBtn}
                    >
                      <Edit2 size={15} color="#71717A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setDeleteConfirmId(task.id)}
                      style={styles.actionBtn}
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
              <Text style={styles.emptyText}>No matching tasks found.</Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              return (
                <View
                  key={task.id}
                  style={[
                    styles.mobileTaskCard,
                    task.completed && styles.mobileTaskCardCompleted,
                    isSelected && styles.mobileTaskCardSelected,
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
                        style={styles.actionBtn}
                      >
                        <Edit2 size={15} color="#71717A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDeleteConfirmId(task.id)}
                        style={styles.actionBtn}
                      >
                        <Trash2 size={15} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.mobileTaskTitle,
                      task.completed && styles.mobileTaskTitleCompleted,
                    ]}
                  >
                    {task.description || task.title}
                  </Text>

                  <View style={styles.mobileCardMeta}>
                    {task.projectName && (
                      <Text style={styles.mobileProjectText}>
                        📁 {task.projectName} • {task.type}
                      </Text>
                    )}
                    {task.notes ? (
                      <Text style={styles.mobileNotesText}>
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
    backgroundColor: '#EEF2FF',
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
    color: '#4F46E5',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
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
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: 12,
    borderRadius: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  bulkButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  tableRowCompleted: {
    backgroundColor: '#FAFAFA',
    opacity: 0.75,
  },
  tableRowSelected: {
    backgroundColor: '#EEF2FF',
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tdTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  tdTextTitle: {
    fontSize: 13,
    color: '#18181B',
    fontWeight: '500',
  },
  tdTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#A1A1AA',
  },
  tdTextMuted: {
    fontSize: 12,
    color: '#71717A',
  },
  tdTextNotes: {
    fontSize: 12,
    color: '#71717A',
  },
  smallBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4D4D8',
  },
  smallBoxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
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
  mobileTaskCard: {
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
  mobileTaskCardCompleted: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F4F4F5',
    opacity: 0.75,
  },
  mobileTaskCardSelected: {
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
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
    color: '#18181B',
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
    color: '#71717A',
    fontWeight: '500',
  },
  mobileNotesText: {
    fontSize: 11,
    color: '#A1A1AA',
  },
});
