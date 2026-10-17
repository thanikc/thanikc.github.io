export interface NavLink {
  readonly label: string;
  /** Id of the target on the home page: a section heading, or the footer. */
  readonly fragment: string;
  /** Left out of the phone header, where only two links fit beside brand and language. */
  readonly hideOnPhones?: boolean;
}

/** Primary site sections, shared by the header and the footer nav column. */
export const NAV_LINKS: readonly NavLink[] = [
  {
    label: $localize`:Header nav link to the "What I work on" section@@header.nav.work:Work`,
    fragment: 'work-heading',
    hideOnPhones: true,
  },
  {
    label: $localize`:Header nav link to the projects section@@header.nav.projects:Projects`,
    fragment: 'projects-heading',
  },
  {
    label: $localize`:Header nav link to the contact details in the footer@@header.nav.contact:Contact`,
    fragment: 'contact',
  },
];
