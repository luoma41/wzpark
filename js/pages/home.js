class HomePage {
  constructor() {
    this.map = null;
    this.albums = [];
  }

  async onMount() {
    this.renderLayout();

    // Init map
    this.map = new MapComponent('home-map');
    await this.map.init();

    // Load albums
    await this.loadAlbums();
  }

  renderLayout() {
    const container = document.getElementById('page-home');
    container.innerHTML = `
      <div class="flex flex-col lg:flex-row h-[calc(100vh-3rem)]">
        <!-- Map Section -->
        <div class="w-full lg:w-3/5 h-1/2 lg:h-full relative">
          <div id="home-map" class="w-full h-full"></div>
        </div>
        <!-- Editorial Album List -->
        <div class="w-full lg:w-2/5 h-1/2 lg:h-full overflow-y-auto border-l border-sand/20 bg-warm-white">
          <div class="p-8 lg:p-10">
            <div class="mb-8">
              <p class="editorial-overline">旅行足迹</p>
              <div class="editorial-rule"></div>
              <p class="text-xs text-mid-gray leading-relaxed max-w-xs">
                用镜头记录旅途中的每一个瞬间
              </p>
            </div>
            <div id="album-list" class="space-y-6"></div>
          </div>
        </div>
      </div>
    `;
  }

  async loadAlbums() {
    try {
      this.albums = await apiClient.getAlbums();
      const listEl = document.getElementById('album-list');

      if (this.albums.length === 0) {
        listEl.innerHTML = '<p class="text-mid-gray/50 text-sm italic py-12 text-center">还没有相册，上传你的第一张照片吧</p>';
        return;
      }

      listEl.innerHTML = this.albums.map(album => `
        <a href="#/album/${encodeURIComponent(album.city)}"
           class="block group">
          <div class="aspect-[16/9] rounded-lg overflow-hidden bg-sand/20 mb-3">
            ${album.coverPhotoId ? `
              <img src="${album.coverUrl || ''}" alt="${album.city}"
                   class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]">
            ` : `
              <div class="w-full h-full flex items-center justify-center text-mid-gray text-sm">暂无封面</div>
            `}
          </div>
          <div>
            <h3 class="text-lg font-light text-charcoal leading-tight group-hover:text-moss transition-colors">
              ${album.city.replace(/市$/, '')}
            </h3>
            <p class="text-xs text-mid-gray mt-1">
              ${album.province} <span class="mx-1.5 text-sand">|</span> ${album.photoCount} 张
            </p>
            ${album.description ? `
              <p class="text-xs text-mid-gray/70 mt-2 leading-relaxed line-clamp-2">${album.description}</p>
            ` : ''}
          </div>
        </a>
      `).join('');

    } catch (err) {
      console.error('Failed to load albums:', err);
    }
  }
}

// Register
window.router.register('home', new HomePage());
