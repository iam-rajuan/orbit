import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Info,
  FileSpreadsheet,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react-native';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { parseDailyViewCsv } from '../../utils/csvParser';
import { generateId } from '../../utils/id';
import { Task, Expense } from '../../types';
import { OrbitLogo } from '../../components/brand/OrbitLogo';

export const SettingsManager: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    resetSampleData,
    clearAllData,
  } = useSettingsStore();

  const { theme, themeMode, setThemeMode, isDark } = useTheme();

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

  const themeOptions: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      desc: 'Crisp, high-contrast clean daylight palette',
      icon: <Sun size={20} color={themeMode === 'light' ? theme.primary : theme.textSecondary} />,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      desc: 'Deep zinc & obsidian for low light comfort',
      icon: <Moon size={20} color={themeMode === 'dark' ? theme.primary : theme.textSecondary} />,
    },
    {
      id: 'system',
      label: 'System Sync',
      desc: 'Follows your operating system theme settings',
      icon: <Laptop size={20} color={themeMode === 'system' ? theme.primary : theme.textSecondary} />,
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.titleInfo}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
            <Settings size={20} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Application Settings</Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Theme, Preferences, Categories & Data Management
            </Text>
          </View>
        </View>

        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
              },
            ]}
          >
            <CheckCircle2 size={16} color="#059669" />
            <Text style={[styles.statusText, { color: isDark ? '#34D399' : '#047857' }]}>
              {statusMessage}
            </Text>
          </View>
        )}
      </View>

      {/* 1. Appearance & Theme (Production Grade Theme Selector) */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Appearance & Theme</Text>
        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
          Customize how Orbit looks on your device. Currently active: <Text style={{ fontWeight: '700', color: theme.primary }}>{themeMode === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : themeMode === 'dark' ? 'Dark' : 'Light'}</Text>
        </Text>

        <View style={styles.themeGrid}>
          {themeOptions.map((opt) => {
            const isSelected = themeMode === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.themeOptionCard,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(99,102,241,0.14)' : '#EEF2FF')
                      : theme.surfaceSubtle,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setThemeMode(opt.id)}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionHeader}>
                  <View
                    style={[
                      styles.themeOptionIcon,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(99,102,241,0.25)' : '#E0E7FF')
                          : (isDark ? 'rgba(255,255,255,0.05)' : '#F4F4F5'),
                      },
                    ]}
                  >
                    {opt.icon}
                  </View>
                  {isSelected && (
                    <View style={[styles.activeCheck, { backgroundColor: theme.primary }]}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.themeOptionLabel,
                    {
                      color: isSelected ? theme.primary : theme.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={[styles.themeOptionDesc, { color: theme.textMuted }]}>
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. General Preferences */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Preferences & Localization</Text>

        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Default Currency Symbol</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
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

        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Time Display Format</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>12-hour AM/PM vs 24-hour military</Text>
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

      {/* 3. Custom Categories Management */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Task Categories</Text>
        <View style={styles.pillList}>
          {settings.taskCategories.map((cat) => (
            <View
              key={cat}
              style={[
                styles.pill,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.pillText, { color: theme.textSecondary }]}>{cat}</Text>
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

        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Expense Categories</Text>
        <View style={styles.pillList}>
          {settings.expenseCategories.map((cat) => (
            <View
              key={cat}
              style={[
                styles.pill,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.pillText, { color: theme.textSecondary }]}>{cat}</Text>
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

      {/* 4. Data Backup, Restore & CSV Import */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Backup & Data Portability</Text>
        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
          Export your complete productivity database to JSON or import your spreadsheet CSV files.
        </Text>

        <View style={styles.buttonGrid}>
          <AppButton
            title="Export Backup (JSON)"
            variant="outline"
            icon={<Download size={16} color={theme.textSecondary} />}
            onPress={handleExportJson}
          />

          <AppButton
            title="Import Backup (JSON)"
            variant="outline"
            icon={<Upload size={16} color={theme.textSecondary} />}
            onPress={handleImportJson}
          />

          <AppButton
            title="Import Spreadsheet CSV"
            variant="secondary"
            icon={<FileSpreadsheet size={16} color={theme.primary} />}
            onPress={handleImportCsv}
          />
        </View>

        <View style={[styles.dangerZone, { borderTopColor: theme.border }]}>
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

      {/* 5. Brand Identity & About */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.brandShowcaseHeader}>
          <OrbitLogo size={28} showTagline={true} />
        </View>
        <Text style={[styles.brandManifesto, { color: theme.textSecondary }]}>
          Orbit unifies your daily routine, nutrition & macros, task execution, and finances into a harmonious, perpetual rhythm.
        </Text>

        <View style={[styles.brandModesPreview, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
          <View style={styles.brandModeItem}>
            <Text style={[styles.brandModeTitle, { color: theme.textMuted }]}>Light Identity</Text>
            <View style={[styles.brandBadgeSample, { backgroundColor: '#FFFFFF', borderColor: '#E4E4E7' }]}>
              <OrbitLogo size={20} variant="light" />
            </View>
          </View>

          <View style={styles.brandModeItem}>
            <Text style={[styles.brandModeTitle, { color: theme.textMuted }]}>Dark Identity</Text>
            <View style={[styles.brandBadgeSample, { backgroundColor: '#09090B', borderColor: '#27272A' }]}>
              <OrbitLogo size={20} variant="dark" />
            </View>
          </View>
        </View>

        <View style={[styles.aboutRow, { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }]}>
          <Info size={16} color={theme.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.aboutTitle, { color: theme.textPrimary }]}>Orbit OS • Version 4.2.0</Text>
            <Text style={[styles.aboutSub, { color: theme.textSecondary }]}>
              Mobile & Desktop Cross-Platform Suite • Local-First Storage Architecture
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOptionCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
  },
  themeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  themeOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  themeOptionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  pillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  pillText: {
    fontSize: 12,
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
  },
  aboutSub: {
    fontSize: 12,
    marginTop: 2,
  },
  brandShowcaseHeader: {
    marginBottom: 8,
  },
  brandManifesto: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  brandModesPreview: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandModeItem: {
    flex: 1,
    alignItems: 'center',
  },
  brandModeTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  brandBadgeSample: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
