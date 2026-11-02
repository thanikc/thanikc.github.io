import { expect, test } from '@playwright/test';

// autoCsp ships the policy as a <meta> tag; a violation here means a hashed/inline asset slipped through.
const ROUTES = ['/en/', '/de/', '/th/', '/en/calculator', '/en/privacy-policy'] as const;

for (const route of ROUTES) {
  test(`csp: ${route} loads with a policy and no violations`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie-consent', 'rejected'));
    const violations: string[] = [];
    page.on('console', msg => {
      if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text());
    });

    await page.goto(route);
    await page.waitForLoadState('networkidle');
    if (route === '/en/') {
      await page.locator('button.chat-fab').click();
      await page.waitForLoadState('networkidle');
    }

    expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').count()).toBe(1);
    expect(violations).toEqual([]);
  });
}
