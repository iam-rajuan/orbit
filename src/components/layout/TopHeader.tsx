import React from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Platform } from 'react-native';

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
          backgroundColor: isDark ? 'rgba(12, 12, 16, 0.78)' : 'rgba(255, 255, 255, 0.85)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          paddingHorizontal: isMobile ? 12 : 20,
          minHeight: isMobile ? 54 : 60,
          paddingVertical: isMobile ? 8 : 10,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(25px) saturate(190%)',
                WebkitBackdropFilter: 'blur(25px) saturate(190%)',
              } as any)
            : {}),
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
        {/* Quick Theme Toggle Button - Harmonized with iOS Glass Surface */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.2 : 0.04,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
            },
          ]}
          accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun size={16} color="#FBBF24" />
          ) : (
            <Moon size={16} color="#4F46E5" />
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
