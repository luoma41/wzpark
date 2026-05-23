class Navbar {
  constructor() {
    this.el = document.getElementById('navbar');
    this.render();
  }

  render() {
    const token = getToken();
    this.el.innerHTML = `
      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div class="flex justify-between items-center h-12">
          <a href="#/" class="text-base font-medium tracking-wider text-charcoal hover:text-moss transition-colors">
            wz park
          </a>
          <nav class="flex items-center gap-5">
            <a href="#/" class="text-xs tracking-widest text-mid-gray hover:text-charcoal transition-colors">首页</a>
            ${token ? `
              <a href="#/upload" class="text-xs tracking-widest text-moss hover:text-charcoal transition-colors">上传</a>
              <a href="#/admin" class="text-xs tracking-widest text-mid-gray hover:text-charcoal transition-colors">管理</a>
              <button onclick="logout()" class="text-xs tracking-widest text-mid-gray hover:text-red-600 transition-colors">退出</button>
            ` : `
              <a href="#/admin" class="text-xs tracking-widest text-mid-gray hover:text-charcoal transition-colors">管理</a>
            `}
          </nav>
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
