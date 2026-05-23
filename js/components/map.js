class MapComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markerCluster = null;
    this.geoJsonLayer = null;
    this.cityMarkers = null;
  }

  async init() {
    if (!this.container) return;

    const chinaBounds = L.latLngBounds([[18, 73], [54, 135]]);

    this.map = L.map(this.container, {
      center: [35.8617, 104.1954],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: chinaBounds,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    await this.loadMapData();

    this.map.on('zoomend', () => this.toggleLayerByZoom());
    this.toggleLayerByZoom();
  }

  async loadMapData() {
    try {
      const [albums, mapData, geoJson, cityCoords] = await Promise.all([
        apiClient.getAlbums(),
        apiClient.getMapData(),
        fetch('/js/data/china-outline.json').then(r => r.json()),
        fetch('/js/data/cityCoords.json').then(r => r.json()),
      ]);

      const gpsByCity = {};
      mapData.forEach(d => {
        if (d.lat != null && d.lng != null) {
          gpsByCity[d.city] = { lat: d.lat, lng: d.lng };
        }
      });

      const cityPoints = [];
      albums.forEach(album => {
        const gps = gpsByCity[album.city];
        const fallback = cityCoords[album.city];
        if (gps) {
          cityPoints.push({ city: album.city, lat: gps.lat, lng: gps.lng, count: album.photoCount });
        } else if (fallback) {
          cityPoints.push({ city: album.city, lat: fallback[0], lng: fallback[1], count: album.photoCount });
        }
      });

      // China boundary outline
      this.geoJsonLayer = L.geoJSON(geoJson, {
        style: () => ({
          fillColor: '#F0F0F0',
          weight: 0.5,
          opacity: 0.3,
          color: '#CCC',
          fillOpacity: 0.3,
        }),
      });

      // Artistic city markers (low zoom)
      this.cityMarkers = L.layerGroup();
      cityPoints.forEach(d => {
        const marker = this.createCityMarker(d);
        this.cityMarkers.addLayer(marker);
      });

      // Cluster markers (high zoom) — custom styled
      this.markerCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => this.createClusterIcon(cluster),
      });

      cityPoints.forEach(d => {
        const icon = this.createPinIcon(d.count);
        const marker = L.marker([d.lat, d.lng], { icon });
        marker.bindPopup(`<b>${d.city}</b><br>${d.count} 张照片`);
        marker.on('click', () => {
          window.router.navigate(`/album/${encodeURIComponent(d.city)}`);
        });
        this.markerCluster.addLayer(marker);
      });

    } catch (err) {
      console.error('Map data load failed:', err);
    }
  }

  createCityMarker(d) {
    const size = Math.min(28 + d.count * 4, 44);
    const iconSize = size + 12; // extra space for shadow/scale

    const html = `
      <div class="travel-marker" style="width:${size}px;height:${size}px;">
        <svg viewBox="0 0 24 24" width="${size * 0.52}" height="${size * 0.52}">
          <rect x="2" y="4" width="20" height="15" rx="3" stroke-width="1.4" fill="none"/>
          <circle cx="12" cy="11.5" r="4" stroke-width="1.4" fill="none"/>
          <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>
        </svg>
      </div>`;

    const icon = L.divIcon({
      className: 'travel-marker-wrapper',
      html,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -iconSize / 2],
      tooltipAnchor: [0, -iconSize / 2],
    });

    const marker = L.marker([d.lat, d.lng], { icon });
    marker.bindTooltip(`<b>${d.city}</b><br>${d.count}张照片`, { direction: 'top' });
    marker.bindPopup(`<b>${d.city}</b><br>${d.count} 张照片<br><a href="#/album/${encodeURIComponent(d.city)}">查看相册 &rarr;</a>`);
    marker.on('click', () => {
      window.router.navigate(`/album/${encodeURIComponent(d.city)}`);
    });
    return marker;
  }

  createPinIcon(count) {
    const size = Math.min(24 + count * 2, 34);
    const html = `
      <div class="travel-pin" style="width:${size}px;height:${size}px;">
        <span class="travel-pin-count">${count}</span>
      </div>`;
    return L.divIcon({
      className: 'travel-pin-wrapper',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    const size = count < 10 ? 36 : count < 30 ? 42 : 48;
    const html = `<div class="travel-cluster" style="width:${size}px;height:${size}px;"><span>${count}</span></div>`;
    return L.divIcon({
      className: 'travel-cluster-wrapper',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  toggleLayerByZoom() {
    const zoom = this.map.getZoom();
    if (zoom <= 6) {
      if (this.markerCluster) this.map.removeLayer(this.markerCluster);
      if (this.geoJsonLayer) this.geoJsonLayer.addTo(this.map);
      if (this.cityMarkers) this.cityMarkers.addTo(this.map);
    } else {
      if (this.geoJsonLayer) this.map.removeLayer(this.geoJsonLayer);
      if (this.cityMarkers) this.map.removeLayer(this.cityMarkers);
      if (this.markerCluster) this.markerCluster.addTo(this.map);
    }
  }
}
