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
      <div class="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
        <!-- Map Section -->
        <div class="w-full lg:w-3/5 h-1/2 lg:h-full relative">
          <div id="home-map" class="w-full h-full"></div>
        </div>
        <!-- Album List Section -->
        <div class="w-full lg:w-2/5 h-1/2 lg:h-full overflow-y-auto border-l border-sand/30 bg-warm-white">
          <div class="p-6">
            <h2 class="text-sm font-medium text-mid-gray uppercase tracking-wider mb-4">旅行足迹</h2>
            <div id="album-list" class="space-y-3"></div>
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
        listEl.innerHTML = '<p class="text-mid-gray text-sm">还没有上传照片</p>';
        return;
      }

      listEl.innerHTML = this.albums.map(album => `
        <a href="#/album/${encodeURIComponent(album.city)}"
           class="block group p-3 rounded-lg hover:bg-sand/20 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-16 h-16 rounded-md bg-sand/30 overflow-hidden flex-shrink-0">
              ${album.coverPhotoId ? `
                <img src="${album.coverUrl || ''}" alt="" class="w-full h-full object-cover">
              ` : '<div class="w-full h-full flex items-center justify-center text-xs text-mid-gray">无封面</div>'}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-charcoal font-medium truncate group-hover:text-moss transition-colors">${album.city}</h3>
              <p class="text-xs text-mid-gray">${album.province} · ${album.photoCount} 张</p>
              ${album.description ? `<p class="text-xs text-mid-gray truncate mt-0.5">${album.description}</p>` : ''}
            </div>
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
