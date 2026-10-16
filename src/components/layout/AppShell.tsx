import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, SafeAreaView } from 'react-native';
import { DesktopSidebar } from './DesktopSidebar';
import { TopHeader } from './TopHeader';
import { MobileTabBar } from './MobileTabBar';
import { useTaskStore } from '../../stores/useTaskStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useNutritionStore } from '../../stores/useNutritionStore';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useTheme } from '../../theme/ThemeContext';

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
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const { theme, isDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet);

  // Initialize data stores once on app shell mount
  const { loadTasks } = useTaskStore();
  const { loadRoutines } = useRoutineStore();
  const { loadExpenses } = useExpenseStore();
  const { loadSettings } = useSettingsStore();
  const { loadNutrition } = useNutritionStore();
  const { loadWishlist } = useWishlistStore();

  useEffect(() => {
    loadSettings();
    loadRoutines();
    loadTasks();
    loadExpenses();
    loadNutrition();
    loadWishlist();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#09090B' : theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          <View style={[styles.contentArea, { backgroundColor: theme.background }]}>{children}</View>
          {isMobile && <MobileTabBar />}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainColumn: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
  },
});
