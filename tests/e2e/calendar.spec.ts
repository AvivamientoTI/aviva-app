import { test, expect } from '@playwright/test';

const TEST_USER = process.env.E2E_USERNAME ?? 'test.user';
const TEST_PASS = process.env.E2E_PASSWORD ?? 'testpass123';

async function loginAs(page: import('@playwright/test').Page, username = TEST_USER, password = TEST_PASS) {
    await page.goto('/login');
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel(/Contrase/i).fill(password);
    await page.getByRole('button', { name: /Iniciar Sesi/i }).click();
    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10_000 });
}

test.describe('Calendario de Servicios - sin sesion', () => {
    test('redirige a /login al acceder a /calendar sin sesion', async ({ page }) => {
        await page.goto('/calendar');
        await expect(page).toHaveURL(/login/, { timeout: 6000 });
    });
});

test.describe('Calendario de Servicios - UI publica (ruta protegida)', () => {
    test.skip(
        !process.env.E2E_USERNAME,
        'Requiere E2E_USERNAME y E2E_PASSWORD configurados'
    );

    test.beforeEach(async ({ page }) => {
        await loginAs(page);
        await page.goto('/calendar');
        await page.waitForURL(/calendar/, { timeout: 8000 });
    });

    test('muestra el titulo "Calendario de Servicios"', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Calendario de Servicios/i })).toBeVisible({ timeout: 8000 });
    });

    test('selector de departamento es visible', async ({ page }) => {
        await expect(page.getByPlaceholder('Departamento')).toBeVisible({ timeout: 8000 });
    });

    test('pestanas Calendario y Detallado son visibles', async ({ page }) => {
        await expect(page.getByRole('tab', { name: /Calendario/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Detallado/i })).toBeVisible();
    });

    test('puede cambiar a pestana Detallado', async ({ page }) => {
        await page.getByRole('tab', { name: /Detallado/i }).click();
        await expect(page.getByRole('heading', { level: 3 })).toBeVisible({ timeout: 5000 });
    });

    test('boton Exportar es visible', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Exportar/i })).toBeVisible();
    });

    test('botones de navegacion de mes existen', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Anterior/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Siguiente/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Hoy/i })).toBeVisible();
    });

    test('navegar al mes anterior actualiza el titulo', async ({ page }) => {
        const headingBefore = await page.getByRole('heading', { level: 3 }).first().textContent();
        await page.getByRole('button', { name: /Anterior/i }).click();
        const headingAfter = await page.getByRole('heading', { level: 3 }).first().textContent();
        expect(headingAfter).not.toBe(headingBefore);
    });

    test('boton Hoy vuelve al mes actual', async ({ page }) => {
        const headingCurrent = await page.getByRole('heading', { level: 3 }).first().textContent();
        await page.getByRole('button', { name: /Anterior/i }).click();
        await page.getByRole('button', { name: /Hoy/i }).click();
        const headingRestored = await page.getByRole('heading', { level: 3 }).first().textContent();
        expect(headingRestored).toBe(headingCurrent);
    });
});
