import { test, expect } from '@playwright/test'

test.describe('Golden-path smoke test', () => {
  test('guest query → sign in → query', async ({ page }) => {
    // 1. Open app as guest — should see the query page directly
    await page.goto('/')
    await expect(page.locator('text=New session')).toBeVisible()

    // 2. Ask a question as guest
    const input = page.locator('textarea').first()
    await input.fill('How many customers do we have?')
    await input.press('Enter')

    // 3. Wait for the result: the loading panel disappears and report-panel renders
    await expect(page.locator('.loading-panel')).toBeVisible()
    await expect(page.locator('.loading-panel')).not.toBeVisible({ timeout: 120_000 })
    await expect(page.locator('.report-panel')).toBeVisible()

    // 4. Sign in
    await page.goto('/login')
    const emailInput = page.getByPlaceholder('you@example.com')
    await expect(emailInput).toBeVisible({ timeout: 10_000 })
    await emailInput.fill('admin@queryable.local')
    const pwInput = page.locator('input[type="password"]')
    await pwInput.fill('Admin1')
    await page.locator('button:has-text("Sign in")').click()

    // 5. Should redirect to the query page after login (login form gone, query input visible)
    await expect(page.locator('text=Sign in to query your data sources')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10_000 })

    // 6. Ask another query as authenticated user
    const input2 = page.locator('textarea').first()
    await input2.fill('What are the top products?')
    await input2.press('Enter')

    // 7. Result should appear
    await expect(page.locator('.loading-panel')).toBeVisible()
    await expect(page.locator('.loading-panel')).not.toBeVisible({ timeout: 120_000 })
    await expect(page.locator('.report-panel')).toBeVisible()
  }, { timeout: 300_000 })
})
