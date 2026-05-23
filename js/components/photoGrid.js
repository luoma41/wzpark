class PhotoGrid {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          this.observer.unobserve(img);
        }
      });
    });

    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (btn && this.onDeleteCallback) {
        this.onDeleteCallback(btn.dataset.id);
      }
    });
  }

  render(photos, options = {}) {
    if (!this.container) return;
    const { editable = false, onDelete } = options;
    this.onDeleteCallback = onDelete;

    if (!photos || photos.length === 0) {
      this.container.innerHTML = '<p class="text-mid-gray/50 text-sm italic py-16 text-center">暂无照片</p>';
      return;
    }

    const hasHero = photos.length >= 3;
    const heroPhoto = hasHero ? photos[0] : null;
    const gridPhotos = hasHero ? photos.slice(1) : photos;

    this.container.innerHTML = `
      ${heroPhoto ? `
        <div class="mb-2">
          ${this.photoCard(heroPhoto, editable, -1, true)}
        </div>
      ` : ''}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        ${gridPhotos.map((p, idx) => this.photoCard(p, editable, idx)).join('')}
      </div>
    `;

    this.container.querySelectorAll('img[data-src]').forEach(img => this.observer.observe(img));
  }

  photoCard(photo, editable, idx, isHero = false) {
    const aspectClass = isHero ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-square';
    return `
      <div class="group relative ${aspectClass} overflow-hidden bg-sand/10">
        <img data-src="${photo.thumbnailUrl || photo.cosUrl}"
             alt="${(photo.description || '').replace(/"/g, '&quot;')}"
             class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105">
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        ${photo.description ? `
          <div class="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <p class="text-white text-xs font-light leading-snug">${photo.description}</p>
          </div>
        ` : ''}
        ${editable ? `
          <button data-id="${photo._id}" class="delete-btn absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
            &times;
          </button>
        ` : ''}
      </div>
    `;
  }
}
