import { test, expect } from '@playwright/test';

const TEST_USER = process.env.E2E_USERNAME ?? 'test.user';
const TEST_PASS  = process.env.E2E_PASSWORD  ?? 'testpass123';

async function loginAs(page: import('@playwright/test').Page) {
    await page.goto('/login');
    await page.getByLabel('Nombre de Usuario').fill(TEST_USER);
    await page.getByLabel('Contraseña').fill(TEST_PASS);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10_000 });
}

test.describe('Planificador — sin sesión', () => {
    test('redirige a /login al acceder a /planning sin sesión', async ({ page }) => {
        await page.goto('/planning');
        await expect(page).toHaveURL(/login/, { timeout: 6000 });
    });
});

test.describe('Planificador — flujo básico', () => {
    test.skip(
        !process.env.E2E_USERNAME,
        'Requiere E2E_USERNAME y E2E_PASSWORD configurados'
    );

    test.beforeEach(async ({ page }) => {
        await loginAs(page);
        await page.goto('/planning');
        await page.waitForURL(/planning/, { timeout: 8000 });
    });

    test('muestra título del planificador', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Planificador|Rol|Planning/i }).first()).toBeVisible({ timeout: 8000 });
    });

    test('selector de departamento está presente', async ({ page }) => {
        const deptSelector = page.getByRole('combobox').first();
        await expect(deptSelector).toBeVisible({ timeout: 6000 });
    });

    test('botón para crear nuevo rol es visible para líderes', async ({ page }) => {
        // El botón "Nuevo Rol" / "Crear" debe estar visible para usuarios con permisos
        const createBtn = page.getByRole('button', { name: /Nuevo|Crear|Planificar/i }).first();
        await expect(createBtn).toBeVisible({ timeout: 8000 });
    });

    test('wizard abre al hacer clic en crear nuevo rol', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /Nuevo|Crear|Planificar/i }).first();
        if (await createBtn.isVisible()) {
            await createBtn.click();
            // Debe aparecer algún step del wizard
            await expect(page.getByRole('dialog').or(page.locator('[data-step]')).first()).toBeVisible({ timeout: 6000 });
        }
    });
});
