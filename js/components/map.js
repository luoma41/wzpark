class MapComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markerCluster = null;
    this.geoJsonLayer = null;
    this.cityCircles = null;
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

      // Build GPS lookup from map data (only valid coordinates)
      const gpsByCity = {};
      mapData.forEach(d => {
        if (d.lat != null && d.lng != null) {
          gpsByCity[d.city] = { lat: d.lat, lng: d.lng };
        }
      });

      // Merge: albums provide city + count, coords come from GPS or fallback
      const cityPoints = [];
      albums.forEach(album => {
        const gps = gpsByCity[album.city];
        const fallback = cityCoords[album.city];
        if (gps) {
          cityPoints.push({ city: album.city, lat: gps.lat, lng: gps.lng, count: album.photoCount, source: 'gps' });
        } else if (fallback) {
          cityPoints.push({ city: album.city, lat: fallback[0], lng: fallback[1], count: album.photoCount, source: 'default' });
        } else {
          console.warn('No coordinates for:', album.city);
        }
      });

      // GeoJSON layer for China boundary context
      this.geoJsonLayer = L.geoJSON(geoJson, {
        style: () => ({
          fillColor: '#F0F0F0',
          weight: 0.5,
          opacity: 0.3,
          color: '#CCC',
          fillOpacity: 0.3,
        }),
      });

      // City highlight circles
      this.cityCircles = L.layerGroup();
      cityPoints.forEach(d => {
        const radius = Math.min(12 + d.count * 4, 30);
        const circle = L.circleMarker([d.lat, d.lng], {
          radius: radius,
          fillColor: '#3A6B3A',
          fillOpacity: 0.55,
          color: '#2D5A2D',
          weight: 1.5,
          opacity: 0.8,
        });
        circle.bindTooltip(`<b>${d.city}</b><br>${d.count}张照片`, {
          permanent: false,
          direction: 'top',
        });
        circle.bindPopup(`<b>${d.city}</b><br>${d.count} 张照片<br><a href="#/album/${encodeURIComponent(d.city)}">查看相册 &rarr;</a>`);
        circle.on('click', () => {
          window.router.navigate(`/album/${encodeURIComponent(d.city)}`);
        });
        circle.on('mouseover', function() {
          this.setStyle({ fillColor: '#2D5A2D', fillOpacity: 0.75, weight: 3 });
        });
        circle.on('mouseout', function() {
          this.setStyle({ fillColor: '#3A6B3A', fillOpacity: 0.55, weight: 1.5 });
        });
        this.cityCircles.addLayer(circle);
      });

      // Marker cluster for high zoom
      this.markerCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });

      cityPoints.forEach(d => {
        const marker = L.marker([d.lat, d.lng]);
        marker.bindPopup(`<b>${d.city}</b><br>${d.count} 照片`);
        marker.on('click', () => {
          window.router.navigate(`/album/${encodeURIComponent(d.city)}`);
        });
        this.markerCluster.addLayer(marker);
      });

    } catch (err) {
      console.error('Map data load failed:', err);
    }
  }

  toggleLayerByZoom() {
    const zoom = this.map.getZoom();
    if (zoom <= 6) {
      if (this.markerCluster) this.map.removeLayer(this.markerCluster);
      if (this.geoJsonLayer) this.geoJsonLayer.addTo(this.map);
      if (this.cityCircles) this.cityCircles.addTo(this.map);
    } else {
      if (this.geoJsonLayer) this.map.removeLayer(this.geoJsonLayer);
      if (this.cityCircles) this.map.removeLayer(this.cityCircles);
      if (this.markerCluster) this.markerCluster.addTo(this.map);
    }
  }
}
