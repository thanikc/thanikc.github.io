import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { Browser, Page, expect, test } from '@playwright/test';

/**
 * Design compliance across the matrix in .agents/rules/DESIGN-VERIFICATION.md:
 * 3 routes × 3 widths (the app is light-only — no theme toggle), plus keyboard and
 * motion checks. Measurements are written to tmp/design-check/measure/ for the report.
 */

// Every locale is its own build under its own subpath; the design checks run against
// the English one, and the language checks at the bottom cover the other two.
const ROUTES = ['/en/', '/en/calculator', '/en/privacy-policy'] as const;
const WIDTHS = [360, 768, 1440] as const;
const HEIGHT: Record<number, number> = { 360: 800, 768: 1024, 1440: 900 };

const OUT = join(__dirname, '../../../tmp/design-check');
const MIN_TARGET = 44;
const MIN_GAP = 8;

interface PageOptions {
  width: number;
  reducedMotion?: 'reduce' | 'no-preference';
}

async function openPage(browser: Browser, route: string, options: PageOptions): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: options.width, height: HEIGHT[options.width] },
    reducedMotion: options.reducedMotion ?? 'no-preference',
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'rejected');

    // Layout shift, with what moved, so a failure points at its cause.
    type Shift = { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] };
    const w = window as unknown as {
      __cls: number;
      __shifts: { value: number; nodes: string[] }[];
    };
    w.__cls = 0;
    w.__shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as unknown as Shift[]) {
        if (entry.hadRecentInput) continue;
        w.__cls += entry.value;
        w.__shifts.push({
          value: entry.value,
          nodes: (entry.sources ?? []).map(s => {
            const el = s.node as Element | undefined;
            return el?.tagName
              ? `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`
              : '#text';
          }),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  // Deterministic and free: no live providers, no analytics, no live World Bank data.
  // Both APIs are cross-origin, so the stubs must answer CORS (and the chat preflight).
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  };
  await page.route('**/api/chat', route =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: cors })
      : route.fulfill({
          headers: cors,
          json: {
            answer: 'Stubbed answer for the design check.',
            provider: 'stub',
            sources: [{ text: 'x', score: 1, title: 'Projects' }],
          },
        }),
  );
  await page.route(/googletagmanager|google-analytics/, route => route.abort());
  await page.route(/api\.worldbank\.org/, route =>
    route.fulfill({ headers: cors, json: [{}, []] }),
  );

  await page.goto(route, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('button.chat-fab').waitFor({ state: 'visible' });
  // Entrance animations (staggered card-rise) must finish before anything is measured.
  // The launcher's one-time tooltip peek (`hint-peek`, ~7s) is deliberate and ignored.
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
        .filter(a => (a as CSSAnimation).animationName !== 'hint-peek')
        .every(a => a.playState !== 'running'),
    undefined,
    { timeout: 5000 },
  );
  // Land every finite animation on its end state, so nothing is measured mid-fade.
  await page.evaluate(() =>
    document
      .getAnimations()
      .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
      .forEach(a => a.finish()),
  );
  return page;
}

function record(name: string, data: unknown): void {
  mkdirSync(join(OUT, 'measure'), { recursive: true });
  writeFileSync(join(OUT, 'measure', `${name}.json`), JSON.stringify(data, null, 2));
}

const slug = (route: string) => route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';

/** Interactive elements too small, or closer than MIN_GAP to a neighbour. */
async function targetViolations(page: Page) {
  return page.evaluate(
    ({ minTarget, minGap }) => {
      const describe = (el: Element) =>
        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;

      const targets = [
        ...document.querySelectorAll(
          'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter(el => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const prose = el.tagName === 'A' && s.display === 'inline' && el.closest('p, li');
        return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && !prose;
      });

      // A form control's hit area is its whole Material field, not the bare <input>.
      const rectOf = (el: Element) =>
        (el.closest('.mat-mdc-text-field-wrapper') ?? el).getBoundingClientRect();
      // The chat launcher floats over content by design; it is not a neighbour.
      const floating = (el: Element) => !!el.closest('.chat-launcher');

      const small = targets
        .map(el => ({ el, r: rectOf(el) }))
        .filter(({ r }) => Math.min(r.width, r.height) < minTarget - 0.5)
        .map(({ el, r }) => `${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);

      const crowded: string[] = [];
      const laid = targets.filter(el => !floating(el)).map(el => ({ el, r: rectOf(el) }));
      for (let i = 0; i < laid.length; i++) {
        for (let j = i + 1; j < laid.length; j++) {
          const a = laid[i];
          const b = laid[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          const hGap = Math.max(0, Math.max(a.r.left - b.r.right, b.r.left - a.r.right));
          const vGap = Math.max(0, Math.max(a.r.top - b.r.bottom, b.r.top - a.r.bottom));
          const gap = Math.max(hGap, vGap);
          if (gap < minGap - 0.5) {
            crowded.push(`${describe(a.el)} ↔ ${describe(b.el)} ${gap.toFixed(1)}px`);
          }
        }
      }

      const smallest = Math.min(
        ...targets.map(el => {
          const r = rectOf(el);
          return Math.min(r.width, r.height);
        }),
      );
      return { count: targets.length, smallest: Math.round(smallest), small, crowded };
    },
    { minTarget: MIN_TARGET, minGap: MIN_GAP },
  );
}

async function structure(page: Page, width: number) {
  return page.evaluate(w => {
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    };
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible);
    const levels = headings.map(h => Number(h.tagName[1]));
    const skips = levels.flatMap((level, i) =>
      i > 0 && level > levels[i - 1] + 1
        ? [`h${levels[i - 1]} → h${level} "${headings[i].textContent?.trim()}"`]
        : [],
    );

    const landmarks = {
      banner: !!document.querySelector('header, [role="banner"]'),
      main: !!document.querySelector('main'),
      contentinfo: !!document.querySelector('footer, [role="contentinfo"]'),
      // The primary nav is hidden below sm by design.
      navigation: w < 640 || [...document.querySelectorAll('nav')].some(visible),
    };

    const images = [...document.querySelectorAll('img')].flatMap(img => {
      const problems: string[] = [];
      const alt = img.getAttribute('alt');
      if (alt === null) problems.push('no alt');
      if (alt === '' && img.getAttribute('aria-hidden') !== 'true')
        problems.push('alt="" without aria-hidden');
      const sized = img.hasAttribute('width') && img.hasAttribute('height');
      if (!sized && getComputedStyle(img).aspectRatio === 'auto') problems.push('no size');
      return problems.length ? [`${img.getAttribute('src')}: ${problems.join(', ')}`] : [];
    });

    const root = document.documentElement;
    const horizontalScroll = root.scrollWidth - root.clientWidth;
    const clipped = [
      ...document.querySelectorAll('h1, h2, h3, p, a, button, li, dd, dt, span, label'),
    ]
      .filter(el => {
        const s = getComputedStyle(el);
        // Visually hidden text (.sr-only, the skip link at rest) is clipped on purpose.
        if (el.closest('.sr-only')) return false;
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent?.trim());
        const clips =
          s.overflowX === 'hidden' || s.overflowX === 'clip' || s.textOverflow === 'ellipsis';
        return hasText && clips && visible(el) && el.scrollWidth > el.clientWidth + 1;
      })
      .map(el => `${el.tagName.toLowerCase()} "${el.textContent?.trim().slice(0, 40)}"`);

    // Section rhythm: a header's divider must not run into the content below it.
    // "Below" is the point: the toolbox band puts its header and content in two
    // grid columns at lg, where the vertical gap is meaninglessly negative and
    // the whitespace that matters is horizontal. Only stacked pairs are measured.
    const rhythm = [...document.querySelectorAll('app-section-header')].flatMap(header => {
      const next = header.nextElementSibling;
      if (!next || !visible(next)) return [];
      const above = header.getBoundingClientRect();
      const below = next.getBoundingClientRect();
      if (below.left >= above.right || below.right <= above.left) return [];
      const gap = below.top - above.bottom;
      return gap < 16 ? [`"${header.textContent?.trim().slice(0, 30)}": ${Math.round(gap)}px`] : [];
    });

    return {
      h1: headings.filter(h => h.tagName === 'H1').length,
      rhythm,
      skips,
      landmarks,
      images,
      horizontalScroll,
      clipped,
      cls: (window as unknown as { __cls: number }).__cls,
      shifts: (window as unknown as { __shifts: { value: number; nodes: string[] }[] }).__shifts
        .sort((a, b) => b.value - a.value)
        .slice(0, 3),
    };
  }, width);
}

/**
 * Non-text contrast, which axe does not check: a card must stand apart from the page.
 * Its border needs 3:1 against the page (UX-UI.md), and its fill must visibly differ
 * from the page.
 *
 * The fill floor (1.3) is set above the ratio a hairline border alone can compensate
 * for: at 1.1-1.22 (measured on this app before the fix) a card was only findable by
 * looking for its 1px outline — reported by the owner as "barely see the card borders
 * ... looks like there's no cards at all". 1.3 is not a WCAG number; it is this app's
 * own bar for "reads as a surface at a glance", calibrated against that failure.
 */
async function surfaceSeparation(page: Page) {
  return page.evaluate(() => {
    const rgb = (color: string): number[] | null => {
      const legacy = color.match(/^rgba?\(([^)]+)\)$/);
      if (legacy) {
        const [r, g, b, a = 1] = legacy[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        return a < 1 ? null : [r, g, b];
      }
      const srgb = color.match(/^color\(srgb ([^)]+)\)$/);
      if (srgb) {
        const [r, g, b, a = 1] = srgb[1]
          .split(/[\s/]+/)
          .filter(Boolean)
          .map(Number);
        return a < 1 ? null : [r * 255, g * 255, b * 255];
      }
      return null;
    };
    const luminance = ([r, g, b]: number[]) => {
      const channel = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const shell = document.querySelector('.app-shell');
    const pageColor = shell ? rgb(getComputedStyle(shell).backgroundColor) : null;
    return ['.hero-card', '.surface-card', '.card', '.info-card'].flatMap(sel => {
      const el = document.querySelector(sel);
      if (!el) return [];
      const s = getComputedStyle(el);
      const fill = rgb(s.backgroundColor);
      const border = rgb(s.borderTopColor);
      if (!pageColor || !fill || !border) {
        return [{ sel, error: `unmeasurable: ${s.backgroundColor} / ${s.borderTopColor}` }];
      }
      return [
        {
          sel,
          borderRatio: Number(ratio(border, pageColor).toFixed(2)),
          fillRatio: Number(ratio(fill, pageColor).toFixed(2)),
          raisedIsLighter: luminance(fill) > luminance(pageColor),
        },
      ];
    });
  });
}

/**
 * English at every width, then the translated builds at the narrowest and widest —
 * German words run longer than their English source and Thai wraps differently, so
 * overflow and clipping have to be re-measured per language, not assumed from /en/.
 */
const MATRIX = [
  ...ROUTES.flatMap(route => WIDTHS.map(width => ({ route, width: width as number }))),
  ...(['de', 'th'] as const).flatMap(locale =>
    ROUTES.flatMap(route =>
      [360, 1440].map(width => ({ route: route.replace('/en/', `/${locale}/`), width })),
    ),
  ),
];

for (const { route, width } of MATRIX) {
  {
    const name = `${slug(route)}-${width}`;

    test(`design: ${route} · ${width}px`, async ({ browser }) => {
      const page = await openPage(browser, route, { width });

      const axe = await new AxeBuilder({ page }).analyze();
      const contrast = axe.violations
        .filter(v => v.id === 'color-contrast')
        .flatMap(v => v.nodes.map(n => `${n.target.join(' ')}: ${n.any[0]?.message ?? ''}`));
      const serious = axe.violations
        .filter(v => v.id !== 'color-contrast' && ['serious', 'critical'].includes(v.impact ?? ''))
        .map(v => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`);
      // Nodes axe could not measure (text over the hero photo, gradients, overlaps):
      // these need a visual judgement, so keep where they are and why.
      const incompleteNodes = axe.incomplete
        .filter(v => v.id === 'color-contrast')
        .flatMap(v => v.nodes);
      const contrastUnverifiable = incompleteNodes.length;
      const contrastUnverifiableSample = incompleteNodes
        .slice(0, 20)
        .map(n => `${n.target.join(' ')}: ${n.any[0]?.message ?? ''}`);

      const targets = await targetViolations(page);
      const shape = await structure(page, width);
      const surfaces = await surfaceSeparation(page);
      const weakSurfaces = surfaces
        .filter(s => 'error' in s || s.borderRatio < 3 || s.fillRatio < 1.3)
        .map(s => JSON.stringify(s));

      mkdirSync(join(OUT, 'screens'), { recursive: true });
      await page.screenshot({ path: join(OUT, 'screens', `${name}.png`), fullPage: true });
      record(name, {
        route,
        width,
        contrast,
        contrastUnverifiable,
        contrastUnverifiableSample,
        serious,
        targets,
        surfaces,
        ...shape,
      });

      expect.soft(contrast, 'contrast (axe)').toEqual([]);
      expect.soft(serious, 'serious/critical axe violations').toEqual([]);
      expect.soft(targets.small, 'targets under 44px').toEqual([]);
      expect.soft(targets.crowded, 'targets closer than 8px').toEqual([]);
      expect.soft(shape.h1, 'exactly one h1').toBe(1);
      expect.soft(shape.skips, 'heading level skips').toEqual([]);
      expect.soft(shape.landmarks, 'landmarks').toEqual({
        banner: true,
        main: true,
        contentinfo: true,
        navigation: true,
      });
      expect.soft(shape.images, 'image alt/size').toEqual([]);
      expect.soft(shape.horizontalScroll, 'horizontal page scroll (px)').toBeLessThanOrEqual(0);
      expect.soft(shape.clipped, 'clipped text').toEqual([]);
      expect.soft(shape.cls, 'cumulative layout shift').toBeLessThan(0.1);
      expect.soft(weakSurfaces, 'cards stand apart from the page').toEqual([]);
      expect.soft(shape.rhythm, 'section header → content gap ≥ 16px').toEqual([]);

      await page.context().close();
    });
  }
}

for (const route of ROUTES) {
  test(`motion: ${route} settles under reduced motion`, async ({ browser }) => {
    const page = await openPage(browser, route, {
      width: 360,
      reducedMotion: 'reduce',
    });

    // Collapsed animations (active duration ≈ 0) may still sit in their delay; nothing moves.
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter(a => a.playState === 'running')
        .filter(a => Number(a.effect?.getComputedTiming().activeDuration ?? 0) > 1)
        .map(a => (a as CSSAnimation).animationName ?? a.constructor.name),
    );
    record(`motion-${slug(route)}`, { route, running });
    expect(running).toEqual([]);

    await page.context().close();
  });
}

// The launcher tip is hover-only text; measure it fully shown.
test('contrast: chat launcher tip is readable on hover', async ({ browser }) => {
  const page = await openPage(browser, '/en/', { width: 1440, reducedMotion: 'reduce' });
  await page.locator('button.chat-fab').hover();
  await expect(page.locator('#chat-fab-tip')).toHaveCSS('opacity', '1');

  const axe = await new AxeBuilder({ page })
    .include('#chat-fab-tip')
    .withRules(['color-contrast'])
    .analyze();
  const contrast = axe.violations.flatMap(v => v.nodes.map(n => n.any[0]?.message ?? ''));
  record('tip', { contrast, passes: axe.passes.length });

  expect(contrast).toEqual([]);
  await page.context().close();
});

// Regression: `position: sticky` lived on the inner <header>, whose own host
// element is exactly as tall as itself — no room to stick, so the fixed nav
// silently scrolled away with the page. Now on the host (see header.component.scss).
test('header stays pinned to the top while the page scrolls', async ({ browser }) => {
  const page = await openPage(browser, '/en/', { width: 1440 });
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(100);

  const top = await page.evaluate(
    () => document.querySelector('header')?.getBoundingClientRect().top,
  );

  expect(top).toBe(0);
  await page.context().close();
});

// Regression: the open chat's scroll lock pins <body> with `position: fixed;
// top: -scrollY`, and the global `body { height: 100% }` then measured against
// the viewport instead of the content — one screen tall, shifted a full scroll
// offset upwards, so everything (the panel included) was clipped off-screen and
// the page went blank. Opening the chat deep down must still leave the body box
// covering the viewport.
test('the page stays visible when the chat opens far down the page', async ({ browser }) => {
  const page = await openPage(browser, '/en/', { width: 768 });
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(100);
  await page.locator('button.chat-fab').click();
  await expect(page.locator('#chat-dialog')).toBeVisible();

  const covers = await page.evaluate(() => {
    const box = document.body.getBoundingClientRect();
    return box.top <= 0 && box.bottom >= window.innerHeight;
  });

  expect(covers).toBe(true);
  await page.context().close();
});

test.describe('keyboard', () => {
  for (const width of [360, 1440] as const) {
    test(`keyboard: / is fully operable at ${width}px`, async ({ browser }) => {
      // Reduced motion collapses focus transitions, so styles are read in their end state.
      const page = await openPage(browser, '/en/', { width, reducedMotion: 'reduce' });
      // :focus / :focus-visible only match in a document with system focus; with many
      // contexts in parallel that is not a given. Without it, focus can't be judged.
      await page.bringToFront();
      expect(await page.evaluate(() => document.hasFocus()), 'page has system focus').toBe(true);

      // Walk the tab order, tagging each stop and reading its focused styles.
      const signature = (el: Element) =>
        [el, ...el.querySelectorAll('*')]
          .slice(0, 40)
          .flatMap(node =>
            [null, '::before', '::after'].map(pseudo => {
              const s = getComputedStyle(node, pseudo);
              return [
                s.outlineStyle,
                s.outlineWidth,
                s.outlineColor,
                s.boxShadow,
                s.opacity,
                s.backgroundColor,
                s.borderColor,
                s.textDecorationLine,
              ].join(',');
            }),
          )
          .join('|');

      const stops: {
        i: number;
        label: string;
        top: number;
        height: number;
        inMain: boolean;
        focused: string;
        diag: string;
      }[] = [];
      let refocused = 0;
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press('Tab');
        // Another context opening a page can still take system focus; take it back.
        if (!(await page.evaluate(() => document.hasFocus()))) {
          await page.bringToFront();
          refocused++;
        }
        const stop = await page.evaluate(
          async ({ index, sigSource }) => {
            // Focus styles arrive through (collapsed) transitions, and Material's state layer
            // can land later still on a loaded machine: settle, then read a frame later.
            await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
            await new Promise(done => setTimeout(done, 150));
            await new Promise(done => requestAnimationFrame(done));
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            if (el.hasAttribute('data-e2e-stop')) return 'cycled';
            el.setAttribute('data-e2e-stop', String(index));
            const sig = new Function('el', `return (${sigSource})(el)`) as (e: Element) => string;
            const r = el.getBoundingClientRect();
            return {
              i: index,
              label: `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`,
              top: r.top + window.scrollY,
              height: r.height,
              inMain: !!el.closest('main'),
              focused: sig(el),
              // Why a stop would look unfocused: no :focus-visible, no document focus, or
              // a CDK focus origin other than keyboard.
              diag: `focus-visible=${el.matches(':focus-visible')} hasFocus=${document.hasFocus()} cdk=${[...el.classList].filter(c => c.startsWith('cdk-')).join(',') || 'none'}`,
            };
          },
          { index: i, sigSource: signature.toString() },
        );
        if (stop === null || stop === 'cycled') break;
        stops.push(stop);
      }

      // Unfocused styles of the same elements, to prove each focus state is visible.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const unfocused = await page.evaluate(async sigSource => {
        await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
        const sig = new Function('el', `return (${sigSource})(el)`) as (e: Element) => string;
        return Object.fromEntries(
          [...document.querySelectorAll('[data-e2e-stop]')].map(el => [
            el.getAttribute('data-e2e-stop'),
            sig(el),
          ]),
        );
      }, signature.toString());
      const flagged = stops.filter(s => unfocused[String(s.i)] === s.focused);
      const invisibleFocus = flagged.map(s => s.label);
      const invisibleFocusDiag = flagged.slice(0, 5).map(s => `${s.label}: ${s.diag}`);

      // Within <main>, focus moves down the page (same-row neighbours may share a top).
      const outOfOrder = stops
        .filter(s => s.inMain)
        .flatMap((s, i, list) =>
          i > 0 && s.top < list[i - 1].top - Math.max(48, list[i - 1].height)
            ? [`${list[i - 1].label} → ${s.label}`]
            : [],
        );

      // Escape closes the chat and hands focus back to the opener: a contextual hook with a
      // preset question here (the hero's link has none, so it only shows the starters).
      const hook = page.getByRole('button', { name: /^Ask what changed/ });
      await hook.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog', { name: 'AI Ling' })).toBeVisible();
      await expect(page.getByText('Stubbed answer for the design check.')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'AI Ling' })).toBeHidden();
      const focusReturned = await hook.evaluate(el => el === document.activeElement);

      record(`keyboard-${width}`, {
        width,
        stops: stops.map(s => s.label),
        invisibleFocus,
        invisibleFocusDiag,
        outOfOrder,
        focusReturned,
        refocused,
      });

      expect.soft(stops.length, 'tab stops reached').toBeGreaterThan(10);
      expect.soft(invisibleFocus, 'focus without a visible indicator').toEqual([]);
      expect.soft(outOfOrder, 'tab order against visual order').toEqual([]);
      expect.soft(focusReturned, 'focus returns to the opener after Escape').toBe(true);

      await page.context().close();
    });
  }
});

/**
 * Language: one build per locale under its own subpath, reached either by the
 * redirect page at the root (which reads the browser's languages and the remembered
 * choice) or by the selector in the header.
 */
test.describe('language', () => {
  const open = async (browser: Browser, locales: string[], stored?: string) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: locales[0],
    });
    // navigator.languages is not settable through newContext; the redirect reads it.
    await context.addInitScript(
      ([languages, choice]: [string[], string | undefined]) => {
        Object.defineProperty(navigator, 'languages', { get: () => languages });
        localStorage.setItem('cookie-consent', 'rejected');
        if (choice) localStorage.setItem('preferred-language', choice);
      },
      [locales, stored] as [string[], string | undefined],
    );
    return context;
  };

  test('sends a visitor to the language their browser asks for', async ({ browser }) => {
    const context = await open(browser, ['de-DE', 'de']);
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForURL('**/de/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();

    await context.close();
  });

  test('falls back to English for a language the site is not built in', async ({ browser }) => {
    const context = await open(browser, ['fr-FR', 'ja']);
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForURL('**/en/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await context.close();
  });

  test('prefers a remembered choice over the browser language', async ({ browser }) => {
    const context = await open(browser, ['de-DE'], 'th');
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForURL('**/th/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'th');

    await context.close();
  });

  // The pre-i18n URLs, and any shared deep link, arrive at GitHub Pages' 404.
  test('keeps the route when an unprefixed URL is opened', async ({ browser }) => {
    const context = await open(browser, ['de-DE']);
    const page = await context.newPage();

    await page.goto('/calculator');
    await page.waitForURL('**/de/calculator');

    await expect(page.locator('h1')).toHaveText('Rentenrechner');

    await context.close();
  });

  test('switching language keeps the page and is remembered', async ({ browser }) => {
    const context = await open(browser, ['en-US']);
    const page = await context.newPage();

    await page.goto('/en/privacy-policy');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
    await page.waitForURL('**/de/privacy-policy');

    await expect(page.locator('h1')).toHaveText('Datenschutzerklärung');
    expect(await page.evaluate(() => localStorage.getItem('preferred-language'))).toBe('de');

    // And the choice survives: the root now goes straight to German.
    await page.goto('/');
    await page.waitForURL('**/de/');

    await context.close();
  });

  test('offers the languages named in their own language', async ({ browser }) => {
    const context = await open(browser, ['en-US']);
    const page = await context.newPage();

    await page.goto('/en/');
    const select = page.getByRole('combobox', { name: 'Language' });

    await expect(select).toHaveValue('en');
    const labels = (await select.locator('option').allInnerTexts()).map(label => label.trim());
    expect(labels).toEqual(['English', 'Deutsch', 'ไทย']);

    // No room for the language name next to the brand on a phone: only the flag
    // shows, and it has to still be there (not just the label hidden away). It's an
    // inline SVG, not a flag emoji glyph — those need a system font this can't rely on.
    const narrow = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const narrowPage = await narrow.newPage();
    await narrowPage.goto('/en/');
    await expect(narrowPage.locator('.language-label')).toBeHidden();
    await expect(narrowPage.locator('.language-flag')).toBeVisible();
    await expect(narrowPage.locator('.language-flag svg')).toBeVisible();
    await narrow.close();

    // 44px hit area, like every other control in the header.
    const box = await select.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TARGET);

    await context.close();
  });
});
