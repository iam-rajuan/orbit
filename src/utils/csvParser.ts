import { Task, Expense } from '../types';
import { parseCurrencyInput } from './currency';

/**
 * Splits raw CSV text into rows handling quoted strings that span multiple lines.
 */
export function splitCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export interface ParsedCsvDay {
  dateKey: string; // YYYY-MM-DD
  rawDate: string;
  routines: { time: string; title: string; completed: boolean }[];
  tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[];
  expenses: Omit<Expense, 'id' | 'createdAt'>[];
}

/**
 * Parses a standard 3-section Daily View CSV into day-separated structured records.
 */
export function parseDailyViewCsv(csvText: string): ParsedCsvDay[] {
  const rows = splitCsvRows(csvText);
  const days: ParsedCsvDay[] = [];

  let currentDay: ParsedCsvDay | null = null;
  let currentSection: 'NONE' | 'ROUTINE' | 'TASKS' | 'EXPENSES' = 'NONE';
  let routineTimes: string[] = [];
  let routineTitles: string[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const joined = row.join(' ').trim();

    // Check for date header e.g. "📅  TUESDAY, 06-OCT-2026"
    const dateMatch = joined.match(/(\d{2}-[A-Za-z]{3}-\d{4})/);
    if (joined.includes('📅') || (dateMatch && joined.includes('DAY'))) {
      if (currentDay) {
        days.push(currentDay);
      }
      const rawDateStr = dateMatch ? dateMatch[1] : '';
      let dateKey = '2026-10-06';
      if (rawDateStr) {
        const [d, mStr, y] = rawDateStr.split('-');
        const months: Record<string, string> = {
          JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
          JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
        };
        const monthNum = months[mStr.toUpperCase()] || '10';
        dateKey = `${y}-${monthNum}-${d.padStart(2, '0')}`;
      }

      currentDay = {
        dateKey,
        rawDate: joined,
        routines: [],
        tasks: [],
        expenses: [],
      };
      currentSection = 'NONE';
      routineTimes = [];
      routineTitles = [];
      continue;
    }

    if (!currentDay) continue;

    if (joined.includes('DAILY ROUTINE')) {
      currentSection = 'ROUTINE';
      continue;
    }

    if (joined.includes('DAILY TASKS')) {
      currentSection = 'TASKS';
      continue;
    }

    if (joined.includes('DAILY EXPENSES')) {
      currentSection = 'EXPENSES';
      continue;
    }

    if (currentSection === 'ROUTINE') {
      const validCols = row.filter((c) => c.length > 0);
      if (validCols.length >= 2) {
        if (validCols.some((c) => c.includes('AM') || c.includes('PM'))) {
          routineTimes = validCols;
        } else if (validCols.some((c) => c === 'TRUE' || c === 'FALSE')) {
          for (let i = 0; i < validCols.length; i++) {
            if (i < routineTimes.length && i < routineTitles.length) {
              currentDay.routines.push({
                time: routineTimes[i],
                title: routineTitles[i],
                completed: validCols[i].toUpperCase() === 'TRUE',
              });
            }
          }
          currentSection = 'NONE';
        } else {
          routineTitles = validCols;
        }
      }
      continue;
    }

    if (currentSection === 'TASKS') {
      if (joined.startsWith('+ Add Task') || joined.startsWith('Task Progress:')) {
        currentSection = 'NONE';
        continue;
      }
      // Header row
      if (row.includes('Category') && row.includes('Priority')) {
        continue;
      }
      // Task row: Done, Category, Type, Priority, Project / List, Task Description, Notes
      const nonEmpties = row.filter((c) => c.length > 0);
      if (nonEmpties.length >= 4) {
        const doneStr = row[1] || nonEmpties[0] || 'FALSE';
        const isDone = doneStr.toUpperCase() === 'TRUE';
        
        let category = 'Office';
        let type = 'Project';
        let priority: any = 'Medium';
        let project = '';
        let description = '';
        let notes = '';

        // Find done index
        const doneIdx = row.findIndex((c) => c.toUpperCase() === 'TRUE' || c.toUpperCase() === 'FALSE');
        if (doneIdx !== -1) {
          category = row[doneIdx + 1] || 'General';
          type = row[doneIdx + 2] || 'Project';
          const prioCandidate = row[doneIdx + 3] || 'Medium';
          priority = (['High', 'Medium', 'Low'].includes(prioCandidate) ? prioCandidate : 'Medium') as any;
          project = row[doneIdx + 4] || '';
          
          // Remaining fields contain description and notes
          const remaining = row.slice(doneIdx + 5).filter((c) => c.length > 0);
          if (remaining.length >= 2) {
            description = remaining[0];
            notes = remaining[remaining.length - 1];
          } else if (remaining.length === 1) {
            description = remaining[0];
          }

          currentDay.tasks.push({
            title: description.split('\n')[0].replace(/^[•\-\*]\s*/, '').trim() || 'Task',
            description,
            category,
            type,
            priority,
            projectName: project,
            notes,
            date: currentDay.dateKey,
            completed: isDone,
          });
        }
      }
      continue;
    }

    if (currentSection === 'EXPENSES') {
      if (joined.startsWith('+ Add Expense') || joined.startsWith('Total Daily Expenses')) {
        currentSection = 'NONE';
        continue;
      }
      if (row.includes('Category') && (row.includes('Expense Item') || row.includes('Amount'))) {
        continue;
      }
      const nonEmpties = row.filter((c) => c.length > 0);
      if (nonEmpties.length >= 4) {
        const numCandidate = parseInt(nonEmpties[0], 10);
        if (!isNaN(numCandidate)) {
          const itemNum = numCandidate;
          const category = nonEmpties[1] || 'Other';
          const payment = nonEmpties[2] || 'Cash';
          const expType = (nonEmpties[3] === 'Want' ? 'Want' : 'Need') as any;
          const title = nonEmpties[4] || '';
          
          // Last non-empty is amount
          const lastCol = nonEmpties[nonEmpties.length - 1];
          const amount = parseCurrencyInput(lastCol);

          let notesDesc = '';
          if (nonEmpties.length > 6) {
            notesDesc = nonEmpties[5];
          }

          currentDay.expenses.push({
            itemNumber: itemNum,
            category,
            paymentMethod: payment,
            type: expType,
            title,
            description: notesDesc,
            amount,
            date: currentDay.dateKey,
          });
        }
      }
      continue;
    }
  }

  if (currentDay && !days.includes(currentDay)) {
    days.push(currentDay);
  }

  return days;
}
