class UploadPage {
  constructor() {
    this.files = [];
    this.stsCredentials = null;
    this.citiesData = [];
    this.editingIdx = new Set();
  }

  async onMount() {
    if (!getToken()) { window.router.navigate('/admin'); return; }
    this.renderLayout();
    this.loadSts();
    // Load province-city data
    try {
      const res = await fetch('/js/data/cities.json');
      this.citiesData = await res.json();
    } catch (e) {
      console.error('Failed to load cities data:', e);
    }
  }

  renderLayout() {
    const container = document.getElementById('page-upload');
    container.innerHTML = `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <a href="#/admin" class="text-sm text-mid-gray hover:text-moss transition-colors mb-6 inline-block">&larr; 返回管理</a>
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

  renderProvinceOptions(selectedProvince) {
    return this.citiesData.map(p =>
      `<option value="${p.name}" ${selectedProvince === p.name ? 'selected' : ''}>${p.name}</option>`
    ).join('');
  }

  renderCityOptions(provinceName, selectedCity) {
    const province = this.citiesData.find(p => p.name === provinceName);
    if (!province) return '<option value="">请先选择省份</option>';
    return province.cities.map(c =>
      `<option value="${c}" ${selectedCity === c ? 'selected' : ''}>${c}</option>`
    ).join('');
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
            ${p.city ? `
              <span id="city-badge-${idx}" class="text-xs text-mid-gray">${p.province || ''} ${p.city}</span>
              <button onclick="uploadPage.startEdit(${idx})" class="text-xs text-mid-gray hover:text-moss hover:underline flex-shrink-0">修改</button>
            ` : `
              <span id="city-badge-${idx}" class="text-xs text-mid-gray">未分类</span>
              <button onclick="uploadPage.startEdit(${idx})" class="text-xs text-moss hover:underline flex-shrink-0">选择位置</button>
            `}
          </div>
          ${this.editingIdx.has(idx) ? `
          <div class="flex items-center gap-2 mt-2" id="edit-panel-${idx}">
            <select id="prov-select-${idx}" onchange="uploadPage.onProvinceChange(${idx}, this.value)" class="text-xs px-2 py-1 border border-sand/50 rounded bg-white">
              <option value="">选择省份</option>
              ${this.renderProvinceOptions(p.province || '')}
            </select>
            <select id="city-select-${idx}" onchange="uploadPage.onCityChange(${idx}, this.value)" class="text-xs px-2 py-1 border border-sand/50 rounded bg-white">
              <option value="">选择城市</option>
              ${p.province ? this.renderCityOptions(p.province, p.city || '') : '<option value="">请先选省份</option>'}
            </select>
          </div>
          ` : ''}
        </div>
        <button onclick="uploadPage.removeFile(${idx})" class="text-xs text-red-500 hover:text-red-700 flex-shrink-0">删除</button>
      </div>
    `).join('');
  }

  startEdit(idx) {
    this.editingIdx.add(idx);
    this.renderPreview();
  }

  onProvinceChange(idx, provinceName) {
    if (!provinceName) {
      this.files[idx].province = null;
      this.files[idx].city = null;
    } else {
      this.files[idx].province = provinceName;
      this.files[idx].city = null;
    }
    this.renderPreview();
  }

  onCityChange(idx, cityName) {
    if (!cityName) return;
    this.files[idx].city = cityName;
    this.editingIdx.delete(idx);
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
      alert('部分照片缺少城市信息，请选择省份和城市后再上传');
      return;
    }

    const btn = document.getElementById('upload-btn');
    btn.disabled = true;
    btn.textContent = '上传中...';

    try {
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

      await apiClient.createPhotos(uploaded);

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
