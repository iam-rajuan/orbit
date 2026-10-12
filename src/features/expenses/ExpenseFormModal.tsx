/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppModal } from '../../components/ui/AppModal';

import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { Expense, ExpenseType } from '../../types';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDateStore } from '../../stores/useDateStore';
import { generateId } from '../../utils/id';
import { parseCurrencyInput } from '../../utils/currency';

interface ExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  visible,
  onClose,
  expenseToEdit,
}) => {
  const { selectedDate } = useDateStore();
  const { createExpense, updateExpense } = useExpenseStore();
  const { settings } = useSettingsStore();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [type, setType] = useState<ExpenseType>('Need');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmountStr(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setType(expenseToEdit.type);
      setDescription(expenseToEdit.description || '');
    } else {
      setTitle('');
      setAmountStr('');
      setCategory(settings.expenseCategories[0] || 'Groceries');
      setPaymentMethod(settings.paymentMethods[0] || 'Cash');
      setType('Need');
      setDescription('');
    }
    setErrors({});
  }, [expenseToEdit, visible]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Expense item title is required';
    const parsedAmount = parseCurrencyInput(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Enter a valid amount greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const amount = parseCurrencyInput(amountStr);
    const now = new Date().toISOString();

    if (expenseToEdit) {
      const updated: Expense = {
        ...expenseToEdit,
        title: title.trim(),
        amount,
        category,
        paymentMethod,
        type,
        description: description.trim() || undefined,
      };
      await updateExpense(updated);
    } else {
      const newExpense: Expense = {
        id: generateId('exp'),
        itemNumber: 0, // Auto-computed in repository
        title: title.trim(),
        amount,
        category,
        paymentMethod,
        type,
        description: description.trim() || undefined,
        date: selectedDate,
        createdAt: now,
      };
      await createExpense(newExpense);
    }

    onClose();
  };

  const categoryOptions = settings.expenseCategories.map((c) => ({ label: c, value: c }));
  const paymentOptions = settings.paymentMethods.map((p) => ({ label: p, value: p }));
  const typeOptions = [
    { label: 'Need (Essential)', value: 'Need' },
    { label: 'Want (Discretionary)', value: 'Want' },
  ];

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
      subtitle={`For date: ${selectedDate}`}
    >
      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <AppInput
            label="Expense Item *"
            placeholder="e.g. Chicken, Cha biri, Internet"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
        </View>
        <View style={{ flex: 1.2 }}>
          <AppInput
            label={`Amount (${settings.currency}) *`}
            placeholder="0.00"
            keyboardType="numeric"
            value={amountStr}
            onChangeText={setAmountStr}
            error={errors.amount}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <AppSelect
            label="Category"
            value={category}
            options={categoryOptions}
            onSelect={setCategory}
          />
        </View>
        <View style={styles.col}>
          <AppSelect
            label="Payment Method"
            value={paymentMethod}
            options={paymentOptions}
            onSelect={setPaymentMethod}
          />
        </View>
      </View>

      <AppSelect
        label="Expense Type"
        value={type}
        options={typeOptions}
        onSelect={(val) => setType(val as ExpenseType)}
      />

      <AppInput
        label="Notes / Description"
        placeholder="e.g. 1 kg fresh chicken from bazar"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.buttonRow}>
        <AppButton
          title="Cancel"
          variant="outline"
          onPress={onClose}
          style={styles.btn}
        />
        <AppButton
          title={expenseToEdit ? 'Save Changes' : 'Record Expense'}
          variant="primary"
          onPress={handleSave}
          style={styles.btn}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    minWidth: 110,
  },
});
