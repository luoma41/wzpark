class UploadPage {
  constructor() {
    this.files = [];
    this.stsCredentials = null;
  }

  async onMount() {
    if (!getToken()) { window.router.navigate('/admin'); return; }
    this.renderLayout();
    this.loadSts();
  }

  renderLayout() {
    const container = document.getElementById('page-upload');
    container.innerHTML = `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <a href="#/admin" class="text-sm text-mid-gray hover:text-moss transition-colors mb-6 inline-block">← 返回管理</a>
        <h2 class="text-2xl font-light text-charcoal mb-6">上传照片</h2>

        <div class="border-2 border-dashed border-sand rounded-xl p-8 text-center mb-6" id="drop-zone">
          <input type="file" id="file-input" multiple accept="image/*" class="hidden" onchange="uploadPage.handleFiles(this.files)">
          <p class="text-mid-gray mb-2">点击或拖拽照片到此处</p>
          <button onclick="document.getElementById('file-input').click()" class="px-4 py-2 border border-sand rounded-lg hover:bg-sand/20 transition-colors">选择文件</button>
        </div>

        <div id="upload-preview" class="space-y-3 mb-6"></div>

        <button id="upload-btn" onclick="uploadPage.uploadAll()" class="w-full py-3 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors hidden">
          确认上传 (<span id="upload-count">0</span>)
        </button>
      </div>
    `;

    // Drag & drop
    const dz = document.getElementById('drop-zone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('bg-sand/10'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('bg-sand/10'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('bg-sand/10');
      this.handleFiles(e.dataTransfer.files);
    });
  }

  async loadSts() {
    try {
      this.stsCredentials = await apiClient.getSts();
    } catch (err) {
      alert('获取上传凭证失败，请重新登录');
    }
  }

  async handleFiles(fileList) {
    const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));

    for (const file of newFiles) {
      const photo = { file, id: crypto.randomUUID(), city: null, province: null, lat: null, lng: null, takenAt: null, description: '' };

      // Extract EXIF
      try {
        const exif = await this.readExif(file);
        if (exif?.GPSLatitude && exif?.GPSLongitude) {
          photo.lat = this.dmsToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
          photo.lng = this.dmsToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
          photo.takenAt = exif.DateTimeOriginal ? this.parseExifDate(exif.DateTimeOriginal) : null;
        }
      } catch (e) { console.log('No EXIF for', file.name); }

      photo.objectUrl = URL.createObjectURL(file);
      this.files.push(photo);
    }

    this.renderPreview();
  }

  readExif(file) {
    return new Promise((resolve) => {
      EXIF.getData(file, function() {
        resolve(EXIF.getAllTags(this));
      });
    });
  }

  dmsToDecimal(dms, ref) {
    let dec = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === 'S' || ref === 'W') dec = -dec;
    return dec;
  }

  parseExifDate(str) {
    const [d, t] = str.split(' ');
    return new Date(d.replace(/:/g, '-') + 'T' + t);
  }

  renderPreview() {
    const el = document.getElementById('upload-preview');
    const btn = document.getElementById('upload-btn');
    const count = document.getElementById('upload-count');

    if (this.files.length === 0) { el.innerHTML = ''; btn.classList.add('hidden'); return; }

    btn.classList.remove('hidden');
    count.textContent = this.files.length;

    el.innerHTML = this.files.map((p, idx) => `
      <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-sand/30">
        <div class="w-12 h-12 bg-sand/20 rounded flex-shrink-0 overflow-hidden">
          <img src="${p.objectUrl}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-charcoal truncate">${p.file.name}</p>
          <div class="flex items-center gap-2 mt-1">
            ${p.lat ? `<span class="text-xs text-moss bg-moss/10 px-1.5 py-0.5 rounded">已定位</span>` : `<span class="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">无GPS</span>`}
            <span id="city-badge-${idx}" class="text-xs text-mid-gray">${p.city || '未分类'}</span>
          </div>
        </div>
        ${!p.city ? `<button onclick="uploadPage.manualLocate(${idx})" class="text-xs text-moss hover:underline flex-shrink-0">手动定位</button>` : `<button onclick="uploadPage.editCity(${idx})" class="text-xs text-mid-gray hover:text-moss hover:underline flex-shrink-0">修改城市</button>`}
        <button onclick="uploadPage.removeFile(${idx})" class="text-xs text-red-500 hover:text-red-700 flex-shrink-0">删除</button>
      </div>
    `).join('');
  }

  manualLocate(idx) {
    const city = prompt('请输入城市名称（如：大理市）:');
    if (!city) return;
    this.files[idx].city = city;
    document.getElementById(`city-badge-${idx}`).textContent = city;
    this.renderPreview();
  }

  editCity(idx) {
    const current = this.files[idx].city || '';
    const city = prompt('修改城市名称:', current);
    if (city === null) return;
    this.files[idx].city = city || null;
    document.getElementById(`city-badge-${idx}`).textContent = city || '未分类';
    this.renderPreview();
  }

  removeFile(idx) {
    if (this.files[idx].objectUrl) URL.revokeObjectURL(this.files[idx].objectUrl);
    this.files.splice(idx, 1);
    this.renderPreview();
  }

  async uploadAll() {
    if (!this.stsCredentials) { alert('上传凭证未就绪'); return; }

    const missingCity = this.files.some(p => !p.city);
    if (missingCity) {
      alert('部分照片缺少城市信息，请点击"手动定位"补充城市名称后再上传');
      return;
    }

    const btn = document.getElementById('upload-btn');
    btn.disabled = true;
    btn.textContent = '上传中...';

    try {
      // 1. Upload files to COS
      const uploaded = [];
      for (const photo of this.files) {
        const key = `photos/${Date.now()}-${photo.id}.${photo.file.name.split('.').pop()}`;

        await this.uploadToCos(key, photo.file);

        uploaded.push({
          filename: key,
          cosUrl: `https://${this.stsCredentials.bucket}.cos.${this.stsCredentials.region}.myqcloud.com/${key}`,
          city: photo.city || '未知城市',
          province: photo.province || '',
          lat: photo.lat,
          lng: photo.lng,
          takenAt: photo.takenAt,
          description: photo.description,
        });
      }

      // 2. Save metadata to MongoDB
      await apiClient.createPhotos(uploaded);

      // After successful upload, before navigating
      this.files.forEach(p => { if (p.objectUrl) URL.revokeObjectURL(p.objectUrl); });

      alert(`成功上传 ${uploaded.length} 张照片`);
      window.router.navigate('/');

    } catch (err) {
      alert('上传失败: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `确认上传 (<span id="upload-count">${this.files.length}</span>)`;
    }
  }

  uploadToCos(key, file) {
    return new Promise((resolve, reject) => {
      const cos = new COS({
        getAuthorization: (options, callback) => {
          callback({
            TmpSecretId: this.stsCredentials.tmpSecretId,
            TmpSecretKey: this.stsCredentials.tmpSecretKey,
            SecurityToken: this.stsCredentials.sessionToken,
            ExpiredTime: this.stsCredentials.expiredTime,
          });
        }
      });

      cos.putObject({
        Bucket: this.stsCredentials.bucket,
        Region: this.stsCredentials.region,
        Key: key,
        Body: file,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}

const uploadPage = new UploadPage();
window.router.register('upload', uploadPage);
