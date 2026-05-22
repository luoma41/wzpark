class Router {
  constructor() {
    this.routes = {
      '/': 'home',
      '/album/:id': 'album',
      '/share/:token': 'share',
      '/admin': 'admin',
      '/upload': 'upload',
    };
    this.pages = {};
  }

  init() {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }

  navigate(path) {
    window.location.hash = path;
  }

  render() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, params] = this.parseRoute(hash);

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const pageId = `page-${path}`;
    const pageEl = document.getElementById(pageId);
    if (pageEl) {
      pageEl.classList.add('active');
      if (this.pages[path] && this.pages[path].onMount) {
        this.pages[path].onMount(params);
      }
    }

    window.scrollTo(0, 0);
  }

  parseRoute(hash) {
    if (hash.startsWith('/album/')) return ['album', { id: hash.split('/')[2] }];
    if (hash.startsWith('/share/')) return ['share', { token: hash.split('/')[2] }];
    if (this.routes[hash]) return [this.routes[hash], {}];
    return ['home', {}];
  }

  register(name, page) {
    this.pages[name] = page;
  }
}
