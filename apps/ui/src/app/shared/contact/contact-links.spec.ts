import { EMAIL_LINK, LINKEDIN_LINK, SOCIAL_LINKS } from './contact-links';

describe('contact links', () => {
  it('offers Email, GitHub Repository and LinkedIn', () => {
    expect(SOCIAL_LINKS.map(link => link.label)).toEqual([
      'Email',
      'GitHub Repository',
      'LinkedIn',
    ]);
  });

  it('gives each link a short visible label', () => {
    expect(SOCIAL_LINKS.map(link => link.shortLabel)).toEqual(['Email', 'GitHub', 'LinkedIn']);
  });

  it('exposes the email and LinkedIn links on their own', () => {
    expect(EMAIL_LINK.href).toBe('mailto:thanikc@gmail.com');
    expect(LINKEDIN_LINK.external).toBe(true);
  });
});
