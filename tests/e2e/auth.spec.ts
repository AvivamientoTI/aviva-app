import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing root without session', async ({ page }) => {
    await page.goto('/');

    // Expect redirection to /login
    await expect(page).toHaveURL(/.*login/);

    // Check for login page elements
    await expect(page.getByText('Bienvenido al portal de Servidores')).toBeVisible();
    await expect(page.getByLabel('Nombre de Usuario')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('should show password error when username is provided but password is too short', async ({ page }) => {
    await page.goto('/login');

    // Fill username so native required is satisfied, but leave password too short
    await page.getByLabel('Nombre de Usuario').fill('usuario.test');
    await page.getByLabel('Contraseña').fill('123');

    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // JS validation should show password error
    await expect(page.getByText('La contraseña debe tener al menos 6 caracteres')).toBeVisible({ timeout: 5000 });
  });

  test('should show username error when username is empty and password is provided', async ({ page }) => {
    await page.goto('/login');

    // Fill password so native required is satisfied for it, but username stays empty
    // We bypass native HTML required by directly calling submit via JS
    await page.getByLabel('Contraseña').fill('password123');

    // Use keyboard to submit - bypasses HTML5 required on the username
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
    await expect(page.getByText('Aviva')).toBeVisible();
    await expect(page.getByText('Bienvenido al portal de Servidores')).toBeVisible();
  });
});
