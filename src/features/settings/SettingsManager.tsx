import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Shield,
  Info,
  DollarSign,
  Palette,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { parseDailyViewCsv } from '../../utils/csvParser';
import { generateId } from '../../utils/id';
import { Task, Expense } from '../../types';

export const SettingsManager: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    resetSampleData,
    clearAllData,
  } = useSettingsStore();

  const { loadTasks, createTask } = useTaskStore();
  const { loadRoutines } = useRoutineStore();
  const { loadExpenses, createExpense } = useExpenseStore();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New category inputs
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');

  const handleExportJson = async () => {
    try {
      const data = await exportData();
      const jsonStr = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-view-v4-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatusMessage('Backup JSON file exported successfully!');
      } else {
        setStatusMessage('Export generated successfully.');
      }
    } catch (e) {
      console.error(e);
      setStatusMessage('Export failed: ' + String(e));
    }
  };

  const handleImportJson = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            await importData(parsed);
            await loadTasks();
            await loadRoutines();
            await loadExpenses();
            setStatusMessage('Data imported and restored successfully!');
          } catch (err) {
            setStatusMessage('Error reading file: ' + String(err));
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      setStatusMessage('File import dialog is supported in web and desktop browser.');
    }
  };

  const handleImportCsv = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvText = event.target?.result as string;
            const parsedDays = parseDailyViewCsv(csvText);
            const now = new Date().toISOString();

            for (const day of parsedDays) {
              for (const t of day.tasks) {
                const task: Task = {
                  id: generateId('task'),
                  title: t.title,
                  description: t.description,
                  category: t.category,
                  type: t.type,
                  priority: t.priority,
                  projectName: t.projectName,
                  notes: t.notes,
                  date: day.dateKey,
                  completed: t.completed,
                  createdAt: now,
                  updatedAt: now,
                };
                await createTask(task);
              }

              for (const exp of day.expenses) {
                const expense: Expense = {
                  id: generateId('exp'),
                  itemNumber: exp.itemNumber,
                  category: exp.category,
                  paymentMethod: exp.paymentMethod,
                  type: exp.type,
                  title: exp.title,
                  description: exp.description,
                  amount: exp.amount,
                  date: day.dateKey,
                  createdAt: now,
                };
                await createExpense(expense);
              }
            }

            await loadTasks();
            await loadExpenses();
            setStatusMessage(`Successfully imported ${parsedDays.length} day(s) from spreadsheet CSV!`);
          } catch (err) {
            setStatusMessage('Error parsing CSV: ' + String(err));
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };

  const handleAddTaskCategory = () => {
    if (!newTaskCategory.trim()) return;
    const cat = newTaskCategory.trim();
    if (!settings.taskCategories.includes(cat)) {
      updateSettings({ taskCategories: [...settings.taskCategories, cat] });
    }
    setNewTaskCategory('');
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseCategory.trim()) return;
    const cat = newExpenseCategory.trim();
    if (!settings.expenseCategories.includes(cat)) {
      updateSettings({ expenseCategories: [...settings.expenseCategories, cat] });
    }
    setNewExpenseCategory('');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Card */}
      <View style={styles.card}>
        <View style={styles.titleInfo}>
          <View style={styles.iconCircle}>
            <Settings size={20} color="#4f46e5" />
          </View>
          <View>
            <Text style={styles.pageTitle}>Application Settings</Text>
            <Text style={styles.pageSubtitle}>
              Preferences, Custom Categories & Data Management
            </Text>
          </View>
        </View>

        {statusMessage && (
          <View style={styles.statusBanner}>
            <CheckCircle2 size={16} color="#059669" />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}
      </View>

      {/* 1. General Preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Preferences & Localization</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Default Currency Symbol</Text>
            <Text style={styles.settingSub}>
              Used across all daily expense tables and summaries
            </Text>
          </View>
          <View style={{ width: 140 }}>
            <AppSelect
              value={settings.currency}
              options={[
                { label: '৳ (BDT - Taka)', value: '৳' },
                { label: '$ (USD)', value: '$' },
                { label: '€ (EUR)', value: '€' },
                { label: '£ (GBP)', value: '£' },
                { label: '₹ (INR)', value: '₹' },
              ]}
              onSelect={(val) => updateSettings({ currency: val })}
            />
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Time Display Format</Text>
            <Text style={styles.settingSub}>12-hour AM/PM vs 24-hour military</Text>
          </View>
          <View style={{ width: 140 }}>
            <AppSelect
              value={settings.timeFormat}
              options={[
                { label: '12-Hour (3:30 AM)', value: '12h' },
                { label: '24-Hour (15:30)', value: '24h' },
              ]}
              onSelect={(val) => updateSettings({ timeFormat: val as any })}
            />
          </View>
        </View>
      </View>

      {/* 2. Custom Categories Management */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Task Categories</Text>
        <View style={styles.pillList}>
          {settings.taskCategories.map((cat) => (
            <View key={cat} style={styles.pill}>
              <Text style={styles.pillText}>{cat}</Text>
            </View>
          ))}
        </View>
        <View style={styles.addInputRow}>
          <AppInput
            placeholder="Add new task category..."
            value={newTaskCategory}
            onChangeText={setNewTaskCategory}
            containerStyle={{ flex: 1, marginBottom: 0 }}
          />
          <AppButton
            title="Add"
            size="sm"
            variant="outline"
            onPress={handleAddTaskCategory}
          />
        </View>

        <View style={{ height: 16 }} />

        <Text style={styles.sectionHeader}>Expense Categories</Text>
        <View style={styles.pillList}>
          {settings.expenseCategories.map((cat) => (
            <View key={cat} style={styles.pill}>
              <Text style={styles.pillText}>{cat}</Text>
            </View>
          ))}
        </View>
        <View style={styles.addInputRow}>
          <AppInput
            placeholder="Add new expense category..."
            value={newExpenseCategory}
            onChangeText={setNewExpenseCategory}
            containerStyle={{ flex: 1, marginBottom: 0 }}
          />
          <AppButton
            title="Add"
            size="sm"
            variant="outline"
            onPress={handleAddExpenseCategory}
          />
        </View>
      </View>

      {/* 3. Data Backup, Restore & CSV Import */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Backup & Data Portability</Text>
        <Text style={styles.sectionDesc}>
          Export your complete productivity database to JSON or import your spreadsheet CSV files.
        </Text>

        <View style={styles.buttonGrid}>
          <AppButton
            title="Export Backup (JSON)"
            variant="outline"
            icon={<Download size={16} color="#475569" />}
            onPress={handleExportJson}
          />

          <AppButton
            title="Import Backup (JSON)"
            variant="outline"
            icon={<Upload size={16} color="#475569" />}
            onPress={handleImportJson}
          />

          <AppButton
            title="Import Spreadsheet CSV"
            variant="secondary"
            icon={<FileSpreadsheet size={16} color="#4f46e5" />}
            onPress={handleImportCsv}
          />
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Data Management & Reset</Text>
          <View style={styles.buttonGrid}>
            <AppButton
              title="Reset to Reference Sample Data"
              variant="outline"
              icon={<RefreshCw size={15} color="#d97706" />}
              onPress={() => setResetConfirmOpen(true)}
            />
            <AppButton
              title="Clear All Local Data"
              variant="danger"
              icon={<Trash2 size={15} color="#ffffff" />}
              onPress={() => setClearConfirmOpen(true)}
            />
          </View>
        </View>
      </View>

      {/* 4. About & Version Info */}
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Info size={18} color="#71717A" />
          <View>
            <Text style={styles.aboutTitle}>Daily View — ToDo App</Text>
            <Text style={styles.aboutSub}>
              Version 4.0.0 (Phase 1 Frontend Architecture) • Local-First IndexedDB & AsyncStorage
            </Text>
          </View>
        </View>
      </View>

      {/* Reset Confirmation */}
      <ConfirmDialog
        visible={resetConfirmOpen}
        title="Reset Sample Data"
        message="This will reload the initial reference spreadsheet data (12 habits, 15 tasks, 8 daily expenses) and reset preferences. Continue?"
        confirmText="Reset to Sample"
        destructive={false}
        onConfirm={async () => {
          await resetSampleData();
          await loadTasks();
          await loadRoutines();
          await loadExpenses();
          setResetConfirmOpen(false);
          setStatusMessage('Data reset to original reference state.');
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {/* Clear Confirmation */}
      <ConfirmDialog
        visible={clearConfirmOpen}
        title="Clear All Local Data"
        message="Are you sure you want to completely erase all routines, tasks, and expense records? This cannot be undone."
        confirmText="Clear Everything"
        destructive={true}
        onConfirm={async () => {
          await clearAllData();
          await loadTasks();
          await loadRoutines();
          await loadExpenses();
          setClearConfirmOpen(false);
          setStatusMessage('All local data cleared.');
        }}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  card: {
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#71717A',
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingText: {
    flex: 1,
    minWidth: 200,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  settingSub: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  pillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  pillText: {
    fontSize: 12,
    color: '#52525B',
    fontWeight: '600',
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dangerZone: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F5E',
    marginBottom: 10,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  aboutSub: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
});
