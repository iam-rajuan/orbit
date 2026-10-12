import { describe, test, expect } from '@jest/globals';
import { formatCurrency, parseCurrencyInput } from '../src/utils/currency';
import { formatDateKey, parseDateKey, offsetDateKey, isRoutineScheduledForDate } from '../src/utils/date';
import { parseDailyViewCsv, splitCsvRows } from '../src/utils/csvParser';
import { SEED_TASKS, SEED_EXPENSES, SEED_ROUTINES } from '../src/data/seed/initialData';

describe('Daily View Calculations & Logic', () => {
  describe('Expense Totals & Currency Formatting', () => {
    test('calculates exact 2026-10-06 seed expense total as ৳1,350.00', () => {
      const dayExpenses = SEED_EXPENSES.filter((e) => e.date === '2026-10-06');
      expect(dayExpenses).toHaveLength(8);

      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      expect(total).toBe(1350.00);

      const formatted = formatCurrency(total, '৳');
      expect(formatted).toBe('৳1,350.00');
    });

    test('calculates correct Need vs Want distribution for 2026-10-06', () => {
      const dayExpenses = SEED_EXPENSES.filter((e) => e.date === '2026-10-06');
      const needTotal = dayExpenses
        .filter((e) => e.type === 'Need')
        .reduce((sum, e) => sum + e.amount, 0);
      const wantTotal = dayExpenses
        .filter((e) => e.type === 'Want')
        .reduce((sum, e) => sum + e.amount, 0);

      // Needs: 350 (chicken) + 500 (chola badam) + 20 (jatayat) + 150 (egg) + 130 (fruits) + 50 (ada rosun) = 1200
      expect(needTotal).toBe(1200.00);
      // Wants: 30 (cha biri) + 120 (lunch) = 150
      expect(wantTotal).toBe(150.00);
      expect(needTotal + wantTotal).toBe(1350.00);
    });

    test('parses dirty and formatted currency inputs accurately', () => {
      expect(parseCurrencyInput('৳1,350.00')).toBe(1350.00);
      expect(parseCurrencyInput(' 500.50 ')).toBe(500.50);
      expect(parseCurrencyInput('৳0.00')).toBe(0);
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput(120)).toBe(120);
    });
  });

  describe('Task Progress Formula', () => {
    test('verifies 2026-10-06 task metrics: 8 of 15 completed = 53%', () => {
      const dayTasks = SEED_TASKS.filter((t) => t.date === '2026-10-06');
      expect(dayTasks).toHaveLength(15);

      const completed = dayTasks.filter((t) => t.completed).length;
      expect(completed).toBe(8);

      const percentage = Math.round((completed / dayTasks.length) * 100);
      expect(percentage).toBe(53);
    });

    test('handles zero tasks gracefully without division by zero errors', () => {
      const total = 0;
      const completed = 0;
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      expect(percentage).toBe(0);
    });
  });

  describe('Routine Habits & Schedule', () => {
    test('contains 12 seed habit activities matching reference spreadsheet', () => {
      expect(SEED_ROUTINES).toHaveLength(12);
      expect(SEED_ROUTINES[0].title).toBe('Wake Up');
      expect(SEED_ROUTINES[0].time).toBe('3:30 AM');
      expect(SEED_ROUTINES[7].title).toBe('Gym');
      expect(SEED_ROUTINES[7].time).toBe('5:30 PM');
      expect(SEED_ROUTINES[11].title).toBe('Sleep');
      expect(SEED_ROUTINES[11].time).toBe('9:00 PM');
    });

    test('determines routine schedule for given days of week', () => {
      // 2026-10-06 is a Tuesday (day 2)
      const isScheduled = isRoutineScheduledForDate([1, 2, 3, 4, 5], '2026-10-06');
      expect(isScheduled).toBe(true);

      // Sunday is day 0
      const isSundayOffice = isRoutineScheduledForDate([1, 2, 3, 4, 5], '2026-10-11');
      expect(isSundayOffice).toBe(false);
    });
  });

  describe('Date Key Normalization', () => {
    test('correctly preserves local date key and supports day navigation', () => {
      expect(offsetDateKey('2026-10-06', 1)).toBe('2026-10-07');
      expect(offsetDateKey('2026-10-06', -1)).toBe('2026-10-05');
      expect(formatDateKey(parseDateKey('2026-10-06'))).toBe('2026-10-06');
    });
  });

  describe('CSV Parser', () => {
    test('handles multiline quoted values properly in CSV rows', () => {
      const csv = `"• Line 1\n• Line 2",Col2\nVal3,Val4`;
      const rows = splitCsvRows(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0][0]).toBe('• Line 1\n• Line 2');
      expect(rows[0][1]).toBe('Col2');
    });

    test('parses multi-day CSV format into structured day models', () => {
      const sampleCsv = `
,"📅  TUESDAY, 06-OCT-2026",,,,,,,,,,,
,⚡ DAILY ROUTINE (12 HABITS),,,,,Routine Progress: 12 / 12 (100%),,,,,,
,3:30 AM,5:00 AM
,Wake Up,Chickpeas
,TRUE,TRUE
,⚡ DAILY TASKS,,,,,,,,,,,
,Done,Category,Type,Priority,Project / List,,Task Description,,,,Notes,
,TRUE,Office,Project,High,Client A,,Fix login API,,,,Testing needed,
,💸 DAILY EXPENSES,,,,,,,,"Daily Total: ৳350.00",,,
,#,Category,Payment,Type,Expense Item,,Notes / Description,,,,Amount (৳),
,1,Groceries,Cash,Need,Chicken,,1 kg fresh chicken from bazar,,,,৳350.00,
`;
      const parsed = parseDailyViewCsv(sampleCsv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].dateKey).toBe('2026-10-06');
      expect(parsed[0].routines).toHaveLength(2);
      expect(parsed[0].tasks).toHaveLength(1);
      expect(parsed[0].tasks[0].category).toBe('Office');
      expect(parsed[0].expenses).toHaveLength(1);
      expect(parsed[0].expenses[0].amount).toBe(350.00);
    });
  });
});
