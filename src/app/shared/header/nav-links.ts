export interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  /** Matching strategy for the active-link highlight. */
  readonly activeOptions: { readonly exact: boolean };
}

/** Single source of truth for the desktop toolbar and the mobile burger menu. */
export const NAV_LINKS: readonly NavLink[] = [
  { path: '/', label: 'Profile', icon: 'person', activeOptions: { exact: true } },
  { path: '/calculator', label: 'Calculator', icon: 'calculate', activeOptions: { exact: false } },
];
