import React from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';

import { DateNavigator } from './DateNavigator';
import { AppButton } from '../ui/AppButton';
import { Plus, Receipt, Sun, Moon } from 'lucide-react-native';
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
        },
      ]}
    >
      <View style={styles.left}>
        <DateNavigator />
      </View>

      <View style={styles.actions}>
        {/* Quick Theme Toggle Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
            },
          ]}
          accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun size={17} color="#FBBF24" />
          ) : (
            <Moon size={17} color="#52525B" />
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
    minHeight: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
