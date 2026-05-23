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
          <div class="flex gap-3">
            <button onclick="adminPage.cleanupOrphans()" class="px-4 py-2 border border-sand rounded-lg hover:bg-sand/20 transition-colors text-sm">清理孤儿文件</button>
            <a href="#/upload" class="px-4 py-2 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors">上传照片</a>
          </div>
        </div>
        <div id="cleanup-result" class="mb-4 hidden"></div>
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

  async cleanupOrphans() {
    if (!confirm('先执行预览模式，确认要清理的孤儿文件列表？')) return;

    const resultEl = document.getElementById('cleanup-result');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = '<p class="text-sm text-mid-gray">正在扫描...</p>';

    try {
      const preview = await api('/cleanup-orphans', { method: 'POST', body: JSON.stringify({ dryRun: true }) });

      if (preview.data.orphansFound === 0) {
        resultEl.innerHTML = `<p class="text-sm text-moss">${preview.data.message || '未发现孤儿文件，COS 和数据库完全一致。'}</p>`;
        return;
      }

      const list = preview.data.orphanKeys.slice(0, 20).map(k => `<li class="text-xs text-mid-gray truncate">${k}</li>`).join('');
      const more = preview.data.orphanKeys.length > 20 ? `<p class="text-xs text-mid-gray mt-1">...还有 ${preview.data.orphanKeys.length - 20} 个文件</p>` : '';

      const confirmDelete = confirm(`发现 ${preview.data.orphansFound} 个孤儿文件（COS 中有但数据库无记录）。\n\n前 20 个：\n${preview.data.orphanKeys.slice(0, 20).join('\n')}\n\n确定删除这些文件吗？`);

      if (!confirmDelete) {
        resultEl.innerHTML = '<p class="text-sm text-amber-600">已取消清理。</p>';
        return;
      }

      resultEl.innerHTML = '<p class="text-sm text-mid-gray">正在删除...</p>';
      const delRes = await api('/cleanup-orphans', { method: 'POST', body: JSON.stringify({ dryRun: false }) });

      resultEl.innerHTML = `
        <div class="p-3 bg-moss/10 rounded-lg text-sm">
          <p class="text-moss font-medium">清理完成</p>
          <p class="text-mid-gray">COS 总文件：${delRes.data.totalCosFiles} 个</p>
          <p class="text-mid-gray">数据库记录：${delRes.data.totalDbFiles} 个</p>
          <p class="text-mid-gray">发现孤儿：${delRes.data.orphansFound} 个</p>
          <p class="text-mid-gray">成功删除：${delRes.data.deleted} 个</p>
        </div>
      `;
    } catch (err) {
      resultEl.innerHTML = `<p class="text-sm text-red-500">扫描失败：${err.message}</p>`;
    }
  }
}

const adminPage = new AdminPage();
window.router.register('admin', adminPage);
