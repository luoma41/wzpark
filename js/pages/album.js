class AlbumPage {
  constructor() {
    this.album = null;
    this.photos = [];
    this.photoGrid = null;
  }

  async onMount(params) {
    const cityId = decodeURIComponent(params.id);
    this.renderLayout(cityId);
    this.photoGrid = new PhotoGrid('album-photos');
    await this.loadAlbum(cityId);
  }

  renderLayout(cityId) {
    const container = document.getElementById('page-album');
    const isAdmin = !!getToken();
    const displayCity = cityId.replace(/市$/, '');

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-6 py-10">
        <a href="#/" class="inline-flex items-center gap-1.5 text-xs tracking-widest text-mid-gray hover:text-moss transition-colors mb-10 group">
          <span class="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
          返回首页
        </a>

        <header class="mb-14">
          <p class="editorial-overline">相册</p>
          <div class="editorial-rule"></div>
          <h1 class="text-4xl md:text-5xl font-light text-charcoal leading-tight tracking-tight mb-4">${displayCity}</h1>
          <div id="album-description" class="text-base md:text-lg text-mid-gray leading-relaxed max-w-2xl"></div>
          ${isAdmin ? `
            <div class="mt-6 flex gap-4">
              <button onclick="albumPage.editDescription()" class="text-xs tracking-widest text-mid-gray hover:text-charcoal border-b border-transparent hover:border-mid-gray pb-0.5 transition-all">编辑说明</button>
              <button onclick="albumPage.createShare()" class="text-xs tracking-widest text-moss hover:text-charcoal border-b border-transparent hover:border-moss pb-0.5 transition-all">分享相册</button>
            </div>
          ` : ''}
        </header>

        <div id="album-photos"></div>
      </div>

      <!-- Share Modal -->
      <div id="share-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
        <div class="bg-warm-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
          <h3 class="text-lg font-medium mb-4">生成分享链接</h3>
          <input type="text" id="share-password" placeholder="4位数字密码" maxlength="4" class="w-full px-3 py-2 border border-sand rounded-lg mb-3 text-center tracking-widest text-lg">
          <div class="flex gap-2">
            <button onclick="albumPage.closeShareModal()" class="flex-1 py-2 border border-sand rounded-lg hover:bg-sand/20 transition-colors text-sm">取消</button>
            <button onclick="albumPage.confirmShare()" class="flex-1 py-2 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors text-sm">生成</button>
          </div>
          <div id="share-result" class="mt-3 hidden">
            <input id="share-url" readonly class="w-full text-xs bg-gray-50 px-2 py-1 rounded mb-2">
            <button onclick="navigator.clipboard.writeText(document.getElementById('share-url').value)" class="text-xs text-moss hover:underline">复制链接</button>
          </div>
        </div>
      </div>
    `;
  }

  async loadAlbum(cityId) {
    try {
      const data = await apiClient.getAlbum(cityId);
      this.album = data.album;
      this.photos = data.photos;

      document.getElementById('album-description').textContent = this.album.description || '暂无描述';
      const groups = this.groupPhotosByDate(this.photos);
      this.photoGrid.renderGrouped(groups, { editable: !!getToken(), onDelete: (id) => albumPage.deletePhoto(id) });

    } catch (err) {
      console.error('Failed to load album:', err);
    }
  }

  groupPhotosByDate(photos) {
    const grouped = {};
    const undated = [];

    photos.forEach(p => {
      if (p.takenYearMonth) {
        if (!grouped[p.takenYearMonth]) grouped[p.takenYearMonth] = [];
        grouped[p.takenYearMonth].push(p);
      } else {
        undated.push(p);
      }
    });

    const groups = Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([ym, pics]) => {
        const [y, m] = ym.split('-');
        return { label: `${y}年${parseInt(m)}月`, photos: pics };
      });

    if (undated.length > 0) {
      groups.push({ label: '未分类', photos: undated });
    }

    return groups;
  }

  editDescription() {
    const desc = prompt('编辑相册说明:', this.album.description || '');
    if (desc === null) return;
    apiClient.updateAlbum({ city: this.album.city, description: desc })
      .then(() => { this.album.description = desc; document.getElementById('album-description').textContent = desc || '暂无描述'; })
      .catch(err => alert('更新失败: ' + err.message));
  }

  createShare() {
    document.getElementById('share-modal').classList.remove('hidden');
    document.getElementById('share-password').value = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('share-result').classList.add('hidden');
  }

  closeShareModal() {
    document.getElementById('share-modal').classList.add('hidden');
  }

  async confirmShare() {
    const password = document.getElementById('share-password').value;
    if (!/^\d{4}$/.test(password)) { alert('请输入4位数字密码'); return; }

    try {
      const result = await apiClient.createShare({ albumId: this.album._id, password });
      document.getElementById('share-url').value = result.url;
      document.getElementById('share-result').classList.remove('hidden');
    } catch (err) {
      alert('生成失败: ' + err.message);
    }
  }

  async deletePhoto(id) {
    if (!confirm('确定删除这张照片?')) return;
    try {
      await apiClient.deletePhoto(id);
      this.photos = this.photos.filter(p => p._id !== id);
      const groups = this.groupPhotosByDate(this.photos);
      this.photoGrid.renderGrouped(groups, { editable: !!getToken(), onDelete: (id) => albumPage.deletePhoto(id) });
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  }
}

const albumPage = new AlbumPage();
window.router.register('album', albumPage);
