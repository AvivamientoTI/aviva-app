import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing root without session', async ({ page }) => {
    await page.goto('/');

    // Expect redirection to /login
    await expect(page).toHaveURL(/.*login/);

    // Check for login page elements
    await expect(page.getByText(/Iglesia Avivamiento y Poder/i)).toBeVisible();
    await expect(page.getByLabel('Nombre de Usuario')).toBeVisible();
    await expect(page.getByLabel(/Contrase/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar Sesi/i })).toBeVisible();
  });

  test('should show password error when username is provided but password is too short', async ({ page }) => {
    await page.goto('/login');

    // Fill username so native required is satisfied, but leave password too short
    await page.getByLabel('Nombre de Usuario').fill('usuario.test');
    await page.getByLabel(/Contrase/i).fill('123');

    await page.getByRole('button', { name: /Iniciar Sesi/i }).click();

    // JS validation should show password error
    await expect(page.getByText(/La contrase.* debe tener al menos 6 caracteres/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show username error when username is empty and password is provided', async ({ page }) => {
    await page.goto('/login');

    // Fill password so native required is satisfied for it, but username stays empty.
    // Dispatching submit directly bypasses HTML5 required validation on the username.
    await page.getByLabel(/Contrase/i).fill('password123');

    await page.evaluate(() => {
      const form = document.querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(submitEvent);
    });

    // JS validation should show username error
    await expect(page.getByText('El nombre de usuario es requerido')).toBeVisible({ timeout: 5000 });
  });

  test('login page should have correct title and branding', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Aviva/i);
    await expect(page.getByRole('heading', { name: /Aviva App/i })).toBeVisible();
    await expect(page.getByText(/Iglesia Avivamiento y Poder/i)).toBeVisible();
  });
});
