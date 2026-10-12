import React, { useState } from 'react';
import { Slot } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { TaskFormModal } from '../../src/features/tasks/TaskFormModal';
import { ExpenseFormModal } from '../../src/features/expenses/ExpenseFormModal';
import { RoutineFormModal } from '../../src/features/routine/RoutineFormModal';

export default function TabsLayout() {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  return (
    <AppShell
      onAddTask={() => setTaskModalOpen(true)}
      onAddExpense={() => setExpenseModalOpen(true)}
      onAddRoutine={() => setRoutineModalOpen(true)}
    >
      <Slot />

      {/* Global Quick Action Modals */}
      <TaskFormModal
        visible={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
      <ExpenseFormModal
        visible={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />
      <RoutineFormModal
        visible={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
      />
    </AppShell>
  );
}
