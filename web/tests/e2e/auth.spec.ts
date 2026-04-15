import { test, expect } from '@playwright/test';

test.describe('Authentication - Forgot Password & Reset', () => {
    test.beforeEach(async ({ context }) => {
        // Inject header for middleware to allow generic bypassing locally
        await context.setExtraHTTPHeaders({
            'x-playwright-test': 'true'
        });
    });

    test('Forgot Password Request Flow', async ({ page }) => {
        await page.goto('/login');

        // Initial state should be "Welcome Back"
        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

        // Click Forgot Password
        await page.getByRole('button', { name: /forgot password\?/i }).click();

        // Should change to "Reset Password" heading
        await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
        await expect(page.getByText(/enter your email and we'll send you a reset link/i)).toBeVisible();

        // Mock the forgot password API
        await page.route('**/api/auth/forgot-password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: "If an account exists, a reset link was sent." })
            });
        });

        // Fill in email and submit
        await page.getByPlaceholder('you@example.com').fill('test@example.com');
        await page.getByRole('button', { name: /send reset link/i }).click();

        // Check for success message
        await expect(page.getByText(/if an account exists, a reset link was sent to your email/i)).toBeVisible();

        // Test "Return to Sign In"
        await page.getByRole('button', { name: /return to sign in/i }).click();
        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    });

    test('Reset Password Completion Flow', async ({ page }) => {
        // Navigate with a mock token
        await page.goto('/reset-password?token=mock_token_123');

        await expect(page.getByRole('heading', { name: /create new password/i })).toBeVisible();

        // Mock the reset password API
        await page.route('**/api/auth/reset-password', async route => {
            const payload = route.request().postDataJSON();
            if (payload.newPassword === 'short') {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: "Password too short" })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, message: "Password updated successfully" })
                });
            }
        });

        // Test password mismatch
        const inputs = page.locator('input[type="password"]');
        await inputs.nth(0).fill('Password123!');
        await inputs.nth(1).fill('Mismatch123!');
        
        // Handle native alert (passwords do not match)
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Passwords do not match');
            await dialog.dismiss();
        });
        await page.getByRole('button', { name: /reset password/i }).click();

        // Test successful reset
        await inputs.nth(0).fill('NewSecurePassword123!');
        await inputs.nth(1).fill('NewSecurePassword123!');
        await page.getByRole('button', { name: /reset password/i }).click();

        // Verify success view
        await expect(page.getByText(/password reset successful/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /sign in to continue/i })).toBeVisible();
    });

    test('Invalid Reset Link Handling', async ({ page }) => {
        // Navigate without token
        await page.goto('/reset-password');
        await expect(page.getByRole('heading', { name: /invalid reset link/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /return to sign in/i })).toBeVisible();

        // Navigate with expired token (mocked 400)
        await page.route('**/api/auth/reset-password', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ error: "Token has expired. Please request a new link." })
            });
        });

        await page.goto('/reset-password?token=expired');
        const inputs = page.locator('input[type="password"]');
        await inputs.nth(0).fill('NewPassword123!');
        await inputs.nth(1).fill('NewPassword123!');

        // Catch alert error
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Token has expired');
            await dialog.dismiss();
        });
        await page.getByRole('button', { name: /reset password/i }).click();
    });
});
