import React from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { DateNavigator } from './DateNavigator';
import { AppButton } from '../ui/AppButton';
import { Plus, CheckSquare, Receipt, Sparkles } from 'lucide-react-native';

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

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <DateNavigator />
      </View>

      {!isMobile && (
        <View style={styles.actions}>
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
              icon={<Receipt size={15} color="#52525B" />}
              onPress={onAddExpense}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
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
});
