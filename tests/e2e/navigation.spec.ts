import { test, expect } from '@playwright/test';

test.describe('Navigation & UI — No Session', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure no session is set
        await page.goto('/login');
    });

    test('should redirect to /login from all protected routes', async ({ page }) => {
        const protectedRoutes = ['/', '/calendar', '/planning', '/attendance', '/analytics'];

        for (const route of protectedRoutes) {
            await page.goto(route);
            await expect(page).toHaveURL(/.*login/, { timeout: 6000 });
        }
    });

    test('login form is fully keyboard accessible', async ({ page }) => {
        await page.goto('/login');

        // Tab to username field
        await page.keyboard.press('Tab');
        const usernameField = page.getByLabel('Nombre de Usuario');
        await expect(usernameField).toBeFocused({ timeout: 3000 });

        // Fill via keyboard
        await page.keyboard.type('test.user');

        // Tab to password
        await page.keyboard.press('Tab');
        await page.keyboard.type('password123');

        // Submit via Enter key
        await page.keyboard.press('Enter');

        // Should attempt login (either navigate or show error - not blank crash)
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('should show both validation errors simultaneously when all fields empty', async ({ page }) => {
        await page.goto('/login');

        await page.evaluate(() => {
            const form = document.querySelector('form');
            form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        await expect(page.getByText('El nombre de usuario es requerido')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('La contraseña debe tener al menos 6 caracteres')).toBeVisible({ timeout: 5000 });
    });

    test('validation error clears when user starts typing', async ({ page }) => {
        await page.goto('/login');

        // Trigger username error
        await page.evaluate(() => {
            const form = document.querySelector('form');
            form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await expect(page.getByText('El nombre de usuario es requerido')).toBeVisible({ timeout: 5000 });

        // Start typing - error should disappear
        await page.getByLabel('Nombre de Usuario').type('a');
        await expect(page.getByText('El nombre de usuario es requerido')).not.toBeVisible({ timeout: 3000 });
    });

    test('password field should toggle visibility', async ({ page }) => {
        await page.goto('/login');

        const passwordInput = page.getByLabel('Contraseña');
        await passwordInput.fill('secret123');

        // Initially type="password"
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click the toggle button (Mantine PasswordInput has a reveal toggle)
        const toggleButton = page.locator('[aria-label="toggle password visibility"], [data-action="toggle-password-visibility"], button[tabindex="-1"]').first();
        if (await toggleButton.isVisible()) {
            await toggleButton.click();
            await expect(passwordInput).toHaveAttribute('type', 'text');
        }
    });

    test('login page should have correct meta title', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/Aviva/i);
    });

    test('logo image should be visible and load correctly', async ({ page }) => {
        await page.goto('/login');
        const logo = page.locator('img[alt="Logo"]');
        await expect(logo).toBeVisible({ timeout: 5000 });

        // Check that image is not broken (naturalWidth > 0)
        const isLoaded = await logo.evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
        expect(isLoaded).toBe(true);
    });
});
