class Navbar {
  constructor() {
    this.el = document.getElementById('navbar');
    this.render();
  }

  render() {
    const token = getToken();
    this.el.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-14">
          <a href="#/" class="text-lg font-medium tracking-wide text-charcoal hover:text-moss transition-colors">
            wz park
          </a>
          <div class="flex items-center gap-4">
            <a href="#/" class="text-sm text-mid-gray hover:text-charcoal transition-colors">首页</a>
            ${token ? `
              <a href="#/upload" class="text-sm text-moss hover:text-charcoal transition-colors">上传</a>
              <a href="#/admin" class="text-sm text-mid-gray hover:text-charcoal transition-colors">管理</a>
              <button onclick="logout()" class="text-sm text-mid-gray hover:text-red-600 transition-colors">退出</button>
            ` : `
              <a href="#/admin" class="text-sm text-mid-gray hover:text-charcoal transition-colors">管理员入口</a>
            `}
          </div>
        </div>
      </div>
    `;
  }
}

function logout() {
  clearToken();
  window.location.hash = '/';
  location.reload();
}

new Navbar();
