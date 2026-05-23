class HomePage {
  constructor() {
    this.map = null;
    this.albums = [];
  }

  async onMount() {
    this.renderLayout();
    this.map = new MapComponent('home-map');
    await this.map.init();
    await this.loadAlbums();
  }

  renderLayout() {
    const container = document.getElementById('page-home');
    container.innerHTML = `
      <div id="home-hero" class="h-[calc(100vh-3rem)] w-full relative">
        <div id="home-map" class="w-full h-full"></div>
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span class="inline-block animate-bounce text-mid-gray/60 text-xs tracking-widest">↓ 向下探索</span>
        </div>
      </div>
      <div id="home-content" class="bg-warm-white">
        <div class="max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <div id="home-stats" class="mb-16"></div>
          <div id="album-list"></div>
        </div>
      </div>
    `;
  }

  async loadAlbums() {
    try {
      this.albums = await apiClient.getAlbums();
      this.renderStats();
      this.renderAlbumGrid();
    } catch (err) {
      console.error('Failed to load albums:', err);
    }
  }

  renderStats() {
    const el = document.getElementById('home-stats');
    if (this.albums.length === 0) {
      el.innerHTML = '';
      return;
    }

    const provinceSet = new Set(this.albums.map(a => a.province).filter(Boolean));
    const totalPhotos = this.albums.reduce((sum, a) => sum + (a.photoCount || 0), 0);

    el.innerHTML = `
      <div class="text-center mb-14">
        <p class="editorial-overline">旅行足迹</p>
        <div class="editorial-rule" style="margin: 0 auto 1.5rem;"></div>
        <p class="text-xs text-mid-gray leading-relaxed max-w-sm mx-auto">
          用镜头记录旅途中的每一个瞬间
        </p>
      </div>
      <div class="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-14">
        <div class="text-center">
          <p class="text-3xl font-light text-charcoal">${provinceSet.size}</p>
          <p class="text-xs text-mid-gray mt-1 tracking-wider">省份</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-light text-charcoal">${this.albums.length}</p>
          <p class="text-xs text-mid-gray mt-1 tracking-wider">城市</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-light text-charcoal">${totalPhotos}</p>
          <p class="text-xs text-mid-gray mt-1 tracking-wider">照片</p>
        </div>
      </div>
    `;
  }

  renderAlbumGrid() {
    const listEl = document.getElementById('album-list');

    if (this.albums.length === 0) {
      listEl.innerHTML = '<p class="text-mid-gray/50 text-sm italic py-12 text-center">还没有相册，上传你的第一张照片吧</p>';
      return;
    }

    listEl.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${this.albums.map(album => `
          <a href="#/album/${encodeURIComponent(album.city)}" class="block group">
            <div class="aspect-[4/3] rounded-lg overflow-hidden bg-sand/20 mb-4">
              ${album.coverPhotoId ? `
                <img src="${album.coverUrl || ''}" alt="${album.city}"
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]">
              ` : `
                <div class="w-full h-full flex items-center justify-center text-mid-gray text-sm">暂无封面</div>
              `}
            </div>
            <h3 class="text-xl font-light text-charcoal leading-tight group-hover:text-moss transition-colors">
              ${album.city.replace(/市$/, '')}
            </h3>
            <p class="text-xs text-mid-gray mt-1.5">
              ${album.province || ''} <span class="mx-1.5 text-sand">|</span> ${album.photoCount || 0} 张
            </p>
            ${album.description ? `
              <p class="text-xs text-mid-gray/70 mt-2 leading-relaxed line-clamp-2">${album.description}</p>
            ` : ''}
          </a>
        `).join('')}
      </div>
    `;
  }
}

window.router.register('home', new HomePage());
