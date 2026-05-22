class SharePage {
  constructor() {
    this.photoGrid = null;
  }

  async onMount(params) {
    this.photoGrid = new PhotoGrid('share-photos');
    this.renderLayout(params.token);
  }

  renderLayout(token) {
    const container = document.getElementById('page-share');
    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div id="password-gate" class="max-w-sm mx-auto mt-20 text-center">
          <h2 class="text-2xl font-light text-charcoal mb-2">wz park</h2>
          <p class="text-mid-gray text-sm mb-6">输入密码查看相册</p>
          <input type="text" id="gate-password" placeholder="4位密码" maxlength="4"
                 class="w-full px-4 py-3 border border-sand rounded-lg text-center text-lg tracking-widest mb-4"
                 onkeypress="if(event.key==='Enter') sharePage.verify()">
          <button onclick="sharePage.verify()" class="w-full py-3 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors">
            进入相册
          </button>
          <p id="gate-error" class="text-red-500 text-sm mt-3 hidden">密码错误</p>
        </div>

        <div id="share-content" class="hidden">
          <div class="mb-8">
            <h1 id="share-city" class="text-3xl font-light text-charcoal mb-2"></h1>
            <p id="share-desc" class="text-mid-gray leading-relaxed"></p>
          </div>
          <div id="share-photos"></div>
        </div>
      </div>
    `;
    this.token = token;
  }

  async verify() {
    const password = document.getElementById('gate-password').value;
    if (!password) return;

    try {
      const data = await apiClient.verifyShare(this.token, password);
      document.getElementById('password-gate').classList.add('hidden');
      document.getElementById('share-content').classList.remove('hidden');

      document.getElementById('share-city').textContent = data.album.city;
      document.getElementById('share-desc').textContent = data.album.description || '';
      this.photoGrid.render(data.photos);

    } catch (err) {
      document.getElementById('gate-error').classList.remove('hidden');
    }
  }
}

const sharePage = new SharePage();
window.router.register('share', sharePage);
