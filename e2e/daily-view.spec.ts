import { test, expect } from '@playwright/test';

test.describe('Daily View — End-to-End Workflow Verification', () => {
  test('1. Loads application and displays branding and initial 2026-10-06 reference date', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Daily View/i);

    // Verify header date displays Tuesday, 06 October 2026
    const dateText = page.getByText(/October 2026/i);
    await expect(dateText).toBeVisible();

    // Verify 12 Routine Habits are displayed
    await expect(page.getByText(/12 Habits/i)).toBeVisible();
    await expect(page.getByText(/Wake Up/i)).toBeVisible();
    await expect(page.getByText(/Gym/i)).toBeVisible();
  });

  test('2. Displays dynamic KPIs matching reference data', async ({ page }) => {
    await page.goto('/');

    // Check Routine Progress: 12 / 12 (100%)
    await expect(page.getByText(/12 \/ 12/i)).toBeVisible();

    // Check Tasks Progress: 8 / 15 (53%)
    await expect(page.getByText(/8 \/ 15/i)).toBeVisible();

    // Check Daily Expenses: ৳1,350.00
    await expect(page.getByText(/৳1,350\.00/i).first()).toBeVisible();
  });

  test('3. Navigates smoothly between feature modules', async ({ page }) => {
    await page.goto('/');

    // Go to Tasks
    await page.getByText(/All Tasks/i).first().click();
    await expect(page.getByText(/Task Description/i).or(page.getByText(/Daily Tasks/i))).toBeVisible();

    // Go to Expenses
    const expensesNav = page.getByLabel('Expenses').or(page.getByText('Expenses'));
    await expensesNav.first().click();
    await expect(page.getByText(/Daily Total/i)).toBeVisible();

    // Go to Settings
    const settingsNav = page.getByLabel('Settings').or(page.getByText('Settings'));
    await settingsNav.first().click();
    await expect(page.getByText(/Application Settings/i)).toBeVisible();
  });

  test('4. Date navigation separates daily data', async ({ page }) => {
    await page.goto('/');
    
    // Initial day expense total is ৳1,350.00
    await expect(page.getByText(/৳1,350\.00/i).first()).toBeVisible();

    // Click next day button
    const nextBtn = page.getByLabel('Next day');
    await nextBtn.click();

    // On 2026-10-07, expense total is ৳1,420.00
    await expect(page.getByText(/৳1,420\.00/i).first()).toBeVisible();
  });
});
