import React from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';

import { DateNavigator } from './DateNavigator';
import { AppButton } from '../ui/AppButton';
import { Plus, Receipt, Sun, Moon } from 'lucide-react-native';
import { OrbitLogo } from '../brand/OrbitLogo';
import { useTheme } from '../../theme/ThemeContext';

interface TopHeaderProps {
  onAddTask?: () => void;
  onAddExpense?: () => void;
  onAddRoutine?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onAddTask,
  onAddExpense,
  onAddRoutine,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
          paddingHorizontal: isMobile ? 12 : 20,
          minHeight: isMobile ? 54 : 60,
          paddingVertical: isMobile ? 8 : 10,
        },
      ]}
    >
      <View style={styles.left}>
        {isMobile && (
          <View style={styles.mobileBrand}>
            <OrbitLogo size={15} />
          </View>
        )}
        <DateNavigator />
      </View>

      <View style={styles.actions}>
        {/* Quick Theme Toggle Button - Harmonized with Theme Surface */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: isDark ? theme.border : theme.borderSubtle,
            },
          ]}
          accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun size={17} color="#FBBF24" />
          ) : (
            <Moon size={17} color="#4F46E5" />
          )}
        </TouchableOpacity>

        {!isMobile && (
          <>
            {onAddTask && (
              <AppButton
                title="Add Task"
                variant="primary"
                size="sm"
                icon={<Plus size={15} color="#ffffff" />}
                onPress={onAddTask}
              />
            )}
            {onAddExpense && (
              <AppButton
                title="Add Expense"
                variant="secondary"
                size="sm"
                icon={<Receipt size={15} color={theme.textSecondary} />}
                onPress={onAddExpense}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  mobileBrand: {
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
