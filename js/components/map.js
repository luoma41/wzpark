class MapComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markerCluster = null;
    this.geoJsonLayer = null;
    this.cityCircles = null;
    this.cityData = {};
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

    // No-label tile layer for clean appearance
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
      const [mapData, geoJson] = await Promise.all([
        apiClient.getMapData(),
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json').then(r => r.json()),
      ]);

      mapData.forEach(d => { this.cityData[d.city] = d; });

      // GeoJSON layer — subtle China outline for context
      this.geoJsonLayer = L.geoJSON(geoJson, {
        style: () => ({
          fillColor: '#F0F0F0',
          weight: 0.5,
          opacity: 0.3,
          color: '#CCC',
          fillOpacity: 0.3,
        }),
      });

      // City highlight circles — prominent colored dots at city positions
      this.cityCircles = L.layerGroup();
      mapData.forEach(d => {
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
        circle.bindPopup(`<b>${d.city}</b><br>${d.count} 照片<br><a href="#/album/${encodeURIComponent(d.city)}">查看相册 &rarr;</a>`);
        circle.on('click', () => {
          window.router.navigate(`/album/${encodeURIComponent(d.city)}`);
        });
        circle.on('mouseover', function() {
          this.setStyle({
            fillColor: '#2D5A2D',
            fillOpacity: 0.75,
            weight: 3,
          });
        });
        circle.on('mouseout', function() {
          this.setStyle({
            fillColor: '#3A6B3A',
            fillOpacity: 0.55,
            weight: 1.5,
          });
        });
        this.cityCircles.addLayer(circle);
      });

      // Marker cluster for high zoom
      this.markerCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });

      mapData.forEach(d => {
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
