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
          backgroundColor: isDark ? 'rgba(18, 18, 22, 0.82)' : 'rgba(255, 255, 255, 0.84)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
          paddingHorizontal: isMobile ? 12 : 20,
          minHeight: isMobile ? 52 : 58,
          paddingVertical: isMobile ? 8 : 10,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(30px) saturate(210%)',
                WebkitBackdropFilter: 'blur(30px) saturate(210%)',
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
        {/* Quick Theme Toggle Button - Circular Apple Glass */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.25 : 0.04,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 4,
            },
          ]}
          accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun size={15} color="#FBBF24" />
          ) : (
            <Moon size={15} color="#6366F1" />
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
