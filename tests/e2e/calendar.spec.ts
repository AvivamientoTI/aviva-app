import { test, expect } from '@playwright/test';

/**
 * Helpers para simular sesión autenticada.
 * Inyecta un mock de sesión en localStorage para bypasear Supabase Auth en E2E.
 * Usar credenciales reales de prueba configuradas en env vars de CI.
 */

const TEST_USER = process.env.E2E_USERNAME ?? 'test.user';
const TEST_PASS  = process.env.E2E_PASSWORD  ?? 'testpass123';

async function loginAs(page: import('@playwright/test').Page, username = TEST_USER, password = TEST_PASS) {
    await page.goto('/login');
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    // Esperar a que la navegación post-login ocurra
    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10_000 });
}

test.describe('Calendario de Servicios — sin sesión', () => {
    test('redirige a /login al acceder a /calendar sin sesión', async ({ page }) => {
        await page.goto('/calendar');
        await expect(page).toHaveURL(/login/, { timeout: 6000 });
    });
});

test.describe('Calendario de Servicios — UI pública (ruta protegida)', () => {
    test.skip(
        !process.env.E2E_USERNAME,
        'Requiere E2E_USERNAME y E2E_PASSWORD configurados'
    );

    test.beforeEach(async ({ page }) => {
        await loginAs(page);
        await page.goto('/calendar');
        await page.waitForURL(/calendar/, { timeout: 8000 });
    });

    test('muestra el título "Calendario de Servicios"', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Calendario de Servicios/i })).toBeVisible({ timeout: 8000 });
    });

    test('selector de departamento es visible', async ({ page }) => {
        await expect(page.getByPlaceholder('Departamento')).toBeVisible({ timeout: 8000 });
    });

    test('pestañas Calendario y Detallado son visibles', async ({ page }) => {
        await expect(page.getByRole('tab', { name: /Calendario/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Detallado/i })).toBeVisible();
    });

    test('puede cambiar a pestaña Detallado', async ({ page }) => {
        await page.getByRole('tab', { name: /Detallado/i }).click();
        // Debería mostrar el mes actual en título
        await expect(page.getByRole('heading', { level: 3 })).toBeVisible({ timeout: 5000 });
    });

    test('botón Exportar es visible', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Exportar/i })).toBeVisible();
    });

    test('botones de navegación de mes existen', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Anterior/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Siguiente/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Hoy/i })).toBeVisible();
    });

    test('navegar al mes anterior actualiza el título', async ({ page }) => {
        const headingBefore = await page.getByRole('heading', { level: 3 }).first().textContent();
        await page.getByRole('button', { name: /Anterior/i }).click();
        const headingAfter = await page.getByRole('heading', { level: 3 }).first().textContent();
        expect(headingAfter).not.toBe(headingBefore);
    });

    test('botón Hoy vuelve al mes actual', async ({ page }) => {
        const headingCurrent = await page.getByRole('heading', { level: 3 }).first().textContent();
        await page.getByRole('button', { name: /Anterior/i }).click();
        await page.getByRole('button', { name: /Hoy/i }).click();
        const headingRestored = await page.getByRole('heading', { level: 3 }).first().textContent();
        expect(headingRestored).toBe(headingCurrent);
    });
});
