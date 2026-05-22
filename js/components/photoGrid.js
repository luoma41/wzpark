class PhotoGrid {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(photos, options = {}) {
    if (!this.container) return;
    const { editable = false, onDelete } = options;

    if (!photos || photos.length === 0) {
      this.container.innerHTML = '<p class="text-mid-gray text-center py-12">暂无照片</p>';
      return;
    }

    this.container.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        ${photos.map(p => this.photoCard(p, editable, onDelete)).join('')}
      </div>
    `;

    // Lazy load images
    this.container.querySelectorAll('img[data-src]').forEach(img => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.disconnect();
          }
        });
      });
      observer.observe(img);
    });
  }

  photoCard(photo, editable, onDelete) {
    return `
      <div class="group relative aspect-square overflow-hidden rounded-lg bg-sand/20">
        <img data-src="${photo.thumbnailUrl || photo.cosUrl}"
             alt="${photo.description || ''}"
             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
        ${photo.description ? `
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="text-white text-xs truncate">${photo.description}</p>
          </div>
        ` : ''}
        ${editable && onDelete ? `
          <button onclick="${onDelete}('${photo._id}')"
                  class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            ×
          </button>
        ` : ''}
      </div>
    `;
  }
}
