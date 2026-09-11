import { contactLink, SOCIAL_LINKS } from './contact-links';

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

  it('looks a link up by its label', () => {
    expect(contactLink('Email').href).toBe('mailto:thanikc@gmail.com');
    expect(contactLink('LinkedIn').external).toBe(true);
  });

  it('fails loudly on an unknown label', () => {
    expect(() => contactLink('Fax')).toThrowError(/Unknown contact link: Fax/);
  });
});
