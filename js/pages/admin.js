class AdminPage {
  constructor() {}

  onMount() {
    if (!getToken()) {
      this.renderLogin();
    } else {
      this.renderDashboard();
      this.loadAlbums();
    }
  }

  renderLogin() {
    const container = document.getElementById('page-admin');
    container.innerHTML = `
      <div class="max-w-sm mx-auto mt-20 px-4">
        <h2 class="text-2xl font-light text-charcoal mb-6 text-center">管理员登录</h2>
        <input type="password" id="login-password" placeholder="密码" class="w-full px-4 py-3 border border-sand rounded-lg mb-4"
               onkeypress="if(event.key==='Enter') adminPage.login()">
        <button onclick="adminPage.login()" class="w-full py-3 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors">登录</button>
        <p id="login-error" class="text-red-500 text-sm mt-3 hidden text-center"></p>
      </div>
    `;
  }

  async login() {
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiClient.login(password);
      setToken(data.token);
      window.location.reload();
    } catch (err) {
      const el = document.getElementById('login-error');
      el.textContent = err.message;
      el.classList.remove('hidden');
    }
  }

  renderDashboard() {
    const container = document.getElementById('page-admin');
    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-light text-charcoal">相册管理</h2>
          <a href="#/upload" class="px-4 py-2 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors">上传照片</a>
        </div>
        <div id="admin-album-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>
    `;
  }

  async loadAlbums() {
    try {
      const albums = await apiClient.getAlbums();
      const el = document.getElementById('admin-album-list');
      el.innerHTML = albums.map(a => `
        <div class="p-4 border border-sand/30 rounded-lg hover:border-sand transition-colors">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-medium text-charcoal">${a.city}</h3>
            <span class="text-xs text-mid-gray bg-sand/20 px-2 py-0.5 rounded">${a.photoCount} 张</span>
          </div>
          <p class="text-sm text-mid-gray truncate mb-3">${a.description || '暂无描述'}</p>
          <a href="#/album/${encodeURIComponent(a.city)}" class="text-sm text-moss hover:underline">查看 →</a>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  }


const adminPage = new AdminPage();
window.router.register('admin', adminPage);
