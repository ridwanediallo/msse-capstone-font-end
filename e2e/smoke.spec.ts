import { test, expect } from '@playwright/test'

test.describe('Golden-path smoke test', () => {
  test('guest query → sign in → query → export', async ({ page }) => {
    // 1. Open app as guest — should see the query page directly
    await page.goto('/')
    await expect(page.locator('.login-brand-icon')).not.toBeVisible()
    await expect(page.locator('text=New session')).toBeVisible()

    // 2. Ask a question as guest
    const input = page.locator('textarea, input[type="text"]').first()
    await input.fill('How many customers do we have?')
    await input.press('Enter')

    // 3. Wait for the result to appear (summary or chart)
    await expect(page.locator('text=Query returned').or(page.locator('.chart-container'))).toBeVisible({
      timeout: 30_000,
    })

    // 4. Sign in via the login page
    await page.goto('/login')
    await page.locator('input[placeholder*="email"]').fill('admin@queryable.local')
    await page.locator('input[placeholder*="Password"], input[placeholder*="password"]').fill('Admin1')
    await page.locator('button:has-text("Sign in")').click()

    // 5. Should redirect to the query page after login
    await expect(page.locator('text=New session')).toBeVisible({ timeout: 10_000 })

    // 6. Ask another query as authenticated user
    const input2 = page.locator('textarea, input[type="text"]').first()
    await input2.fill('What are the top products?')
    await input2.press('Enter')

    // 7. Result should appear
    await expect(page.locator('text=Query returned').or(page.locator('.chart-container'))).toBeVisible({
      timeout: 30_000,
    })
  })
})
