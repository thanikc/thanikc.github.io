import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { Browser, Page, expect, test } from '@playwright/test';

/**
 * Design compliance across the matrix in .agents/rules/DESIGN-VERIFICATION.md:
 * 3 routes × 4 theme states × 3 widths, plus keyboard, motion and theme-token checks.
 * Measurements are written to tmp/design-check/measure/ for the report.
 */

const ROUTES = ['/', '/calculator', '/privacy-policy'] as const;
const WIDTHS = [360, 768, 1440] as const;
const HEIGHT: Record<number, number> = { 360: 800, 768: 1024, 1440: 900 };

/** Explicit modes run against the opposite OS preference, so the toggle must win. */
const THEMES = {
  light: { stored: 'light', os: 'dark' },
  dark: { stored: 'dark', os: 'light' },
  'system-light': { stored: null, os: 'light' },
  'system-dark': { stored: null, os: 'dark' },
} as const;
type ThemeName = keyof typeof THEMES;

const OUT = join(__dirname, '../../../tmp/design-check');
const MIN_TARGET = 44;
const MIN_GAP = 8;

interface PageOptions {
  theme: ThemeName;
  width: number;
  reducedMotion?: 'reduce' | 'no-preference';
}

async function openPage(browser: Browser, route: string, options: PageOptions): Promise<Page> {
  const { stored, os } = THEMES[options.theme];
  const context = await browser.newContext({
    viewport: { width: options.width, height: HEIGHT[options.width] },
    colorScheme: os,
    reducedMotion: options.reducedMotion ?? 'no-preference',
  });
  const page = await context.newPage();

  await page.addInitScript(storedMode => {
    localStorage.setItem('cookie-consent', 'rejected');
    if (storedMode) localStorage.setItem('theme-mode', storedMode);
    else localStorage.removeItem('theme-mode');

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
  }, stored);

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

const slug = (route: string) => (route === '/' ? 'home' : route.slice(1));

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
    const rhythm = [...document.querySelectorAll('app-section-header')].flatMap(header => {
      const next = header.nextElementSibling;
      if (!next || !visible(next)) return [];
      const gap = next.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
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
 * Its border needs 3:1 against the page (UX-UI.md), its fill must visibly differ from
 * the page, and in dark mode a raised surface must be lighter than the page, not a hole.
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

for (const route of ROUTES) {
  for (const theme of Object.keys(THEMES) as ThemeName[]) {
    for (const width of WIDTHS) {
      const name = `${slug(route)}-${theme}-${width}`;

      test(`design: ${route} · ${theme} · ${width}px`, async ({ browser }) => {
        const page = await openPage(browser, route, { theme, width });

        const axe = await new AxeBuilder({ page }).analyze();
        const contrast = axe.violations
          .filter(v => v.id === 'color-contrast')
          .flatMap(v => v.nodes.map(n => `${n.target.join(' ')}: ${n.any[0]?.message ?? ''}`));
        const serious = axe.violations
          .filter(
            v => v.id !== 'color-contrast' && ['serious', 'critical'].includes(v.impact ?? ''),
          )
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
        const dark = theme === 'dark' || theme === 'system-dark';
        const weakSurfaces = surfaces
          .filter(
            s =>
              'error' in s ||
              s.borderRatio < 3 ||
              s.fillRatio < 1.3 ||
              (dark && !s.raisedIsLighter),
          )
          .map(s => JSON.stringify(s));

        mkdirSync(join(OUT, 'screens'), { recursive: true });
        await page.screenshot({ path: join(OUT, 'screens', `${name}.png`), fullPage: true });
        record(name, {
          route,
          theme,
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
}

for (const route of ROUTES) {
  test(`motion: ${route} settles under reduced motion`, async ({ browser }) => {
    const page = await openPage(browser, route, {
      theme: 'light',
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

for (const width of WIDTHS) {
  test(`theme tokens: / follows the theme at ${width}px`, async ({ browser }) => {
    const selectors = [
      'body',
      'h1',
      'mat-toolbar',
      'footer',
      '.surface-card',
      '.surface-chip',
      '.hero-card',
    ];
    const sample = async (theme: ThemeName) => {
      const page = await openPage(browser, '/', { theme, width });
      const styles = await page.evaluate(
        list =>
          Object.fromEntries(
            list.map(sel => {
              const el = document.querySelector(sel);
              const s = el ? getComputedStyle(el) : null;
              // background-image too: the h1 is gradient text (color: transparent).
              return [sel, s ? `${s.color} / ${s.backgroundColor} / ${s.backgroundImage}` : null];
            }),
          ),
        selectors,
      );
      await page.context().close();
      return styles;
    };

    const light = await sample('light');
    const dark = await sample('dark');
    const unchanged = selectors.filter(sel => light[sel] !== null && light[sel] === dark[sel]);
    record(`tokens-${width}`, { width, light, dark, unchanged });

    expect(unchanged, 'elements identical in light and dark').toEqual([]);
  });
}

// The launcher tip is hover-only text; measure it fully shown, in both themes.
for (const theme of ['light', 'dark'] as const) {
  test(`contrast: chat launcher tip is readable on hover (${theme})`, async ({ browser }) => {
    const page = await openPage(browser, '/', { theme, width: 1440, reducedMotion: 'reduce' });
    await page.locator('button.chat-fab').hover();
    await expect(page.locator('#chat-fab-tip')).toHaveCSS('opacity', '1');

    const axe = await new AxeBuilder({ page })
      .include('#chat-fab-tip')
      .withRules(['color-contrast'])
      .analyze();
    const contrast = axe.violations.flatMap(v => v.nodes.map(n => n.any[0]?.message ?? ''));
    record(`tip-${theme}`, { theme, contrast, passes: axe.passes.length });

    expect(contrast).toEqual([]);
    await page.context().close();
  });
}

test.describe('keyboard', () => {
  for (const width of [360, 1440] as const) {
    test(`keyboard: / is fully operable at ${width}px`, async ({ browser }) => {
      // Reduced motion collapses focus transitions, so styles are read in their end state.
      const page = await openPage(browser, '/', { theme: 'light', width, reducedMotion: 'reduce' });
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
