import { routes } from './app.routes';

describe('app routes', () => {
  // The route title replaces the document title at runtime: the tab (and every
  // bookmark or share) should name the person and the role, not "Profile Summary".
  it('titles the home page with the name and the role', () => {
    const home = routes.find(route => route.path === '');

    expect(home?.title).toBe('Thanik Cheowtirakul — Full-stack engineer');
  });
});
