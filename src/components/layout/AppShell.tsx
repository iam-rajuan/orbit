import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, SafeAreaView } from 'react-native';
import { DesktopSidebar } from './DesktopSidebar';
import { TopHeader } from './TopHeader';
import { MobileTabBar } from './MobileTabBar';
import { useTaskStore } from '../../stores/useTaskStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface AppShellProps {
  children: React.ReactNode;
  onAddTask?: () => void;
  onAddExpense?: () => void;
  onAddRoutine?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onAddTask,
  onAddExpense,
  onAddRoutine,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet);

  // Initialize data stores once on app shell mount
  const { loadTasks } = useTaskStore();
  const { loadRoutines } = useRoutineStore();
  const { loadExpenses } = useExpenseStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    loadRoutines();
    loadTasks();
    loadExpenses();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sidebar on Desktop / Tablet */}
        {!isMobile && (
          <DesktopSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Content Column */}
        <View style={styles.mainColumn}>
          <TopHeader
            onAddTask={onAddTask}
            onAddExpense={onAddExpense}
            onAddRoutine={onAddRoutine}
          />
          <View style={styles.contentArea}>{children}</View>
          {isMobile && <MobileTabBar />}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFAF9',
  },
  mainColumn: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
});
