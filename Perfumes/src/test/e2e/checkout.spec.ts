import { test, expect } from '@playwright/test';

test.describe('E2E Checkout Flow', () => {
  test('completes checkout flow with WhatsApp delivery', async ({ page }) => {
    // Start waiting for the response before triggering the page navigation
    const settingsResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/settings') && response.status() === 200
    );

    // Go to shop catalog
    await page.goto('/shop');

    // Await the response
    await settingsResponsePromise;
    await page.waitForTimeout(1000);

    // Wait for products to render
    await page.waitForSelector('article');

    // Click on the first product's "Añadir +" button
    const addButton = page.locator('article button:has-text("Añadir +")').first();
    await addButton.click();

    // The cart should open automatically
    await expect(page.locator('h2:has-text("tu bolsa")')).toBeVisible();

    // Verify subtotal is shown
    const subtotalLocator = page.locator('span:has-text("Subtotal") + span');
    await expect(subtotalLocator).toBeVisible();

    // Click "Iniciar pedido"
    await page.click('button:has-text("Iniciar pedido")');

    // Fill in checkout form details
    await page.fill('input[placeholder="Ej. María González"]', 'Cliente Prueba E2E');
    await page.fill('input[placeholder="Ej. maria@correo.com"]', 'prueba-e2e@ledesir.com');
    await page.fill('input[placeholder="Ej. +54 9 11 1234 5678"]', '+5491112345678');

    // Select "Envío"
    await page.click('button:has-text("Envío")');

    // Fill in address details
    await page.fill('input[placeholder="Calle, número, localidad"]', 'Calle Falsa 123, CABA');

    // Apply Coupon
    await page.fill('input[placeholder="Ej. LEDESIR10"]', 'LEDESIR10');
    await page.click('button:has-text("Aplicar")');

    // Verify coupon applied successfully message
    await expect(page.locator('p:has-text("Cupón aplicado")')).toBeVisible();

    // Mock window.open to prevent redirect to actual WhatsApp API site in headless browser
    await page.evaluate(() => {
      window.open = () => null as any;
    });

    // Submit checkout
    const submitButton = page.locator('button:has-text("Confirmar pedido por WhatsApp")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // The cart should be cleared and closed
    await expect(page.locator('h2:has-text("tu bolsa")')).not.toBeVisible();
  });

  test('redirects to Mercado Pago checkout flow', async ({ page }) => {
    // Start waiting for the response before triggering the page navigation
    const settingsResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/settings') && response.status() === 200
    );

    // Go to shop catalog
    await page.goto('/shop');

    // Await the response
    await settingsResponsePromise;
    await page.waitForTimeout(1000);

    // Wait for products to render
    await page.waitForSelector('article');

    // Click on the first product's "Añadir +" button
    const addButton = page.locator('article button:has-text("Añadir +")').first();
    await addButton.click();

    // Click "Iniciar pedido"
    await page.click('button:has-text("Iniciar pedido")');

    // Fill in client details
    await page.fill('input[placeholder="Ej. María González"]', 'Cliente MP E2E');
    await page.fill('input[placeholder="Ej. maria@correo.com"]', 'mp-e2e@ledesir.com');
    await page.fill('input[placeholder="Ej. +54 9 11 1234 5678"]', '+5491112345678');

    // Select "Mercado Pago" as payment method
    await page.click('button:has-text("Mercado Pago")');

    // Submit the form
    await page.click('button:has-text("Pagar con Mercado Pago")');

    // It should redirect to success/failure simulation or MP site
    await page.waitForURL(/checkout|mercadopago/);
    expect(page.url()).not.toContain('/shop');
  });
});
