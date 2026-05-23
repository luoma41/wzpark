class MapComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markerCluster = null;
    this.geoJsonLayer = null;
  }

  async init() {
    if (!this.container) return;

    // China bounding box
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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

      this.cityData = {};
      mapData.forEach(d => { this.cityData[d.city] = d; });

      this.geoJsonLayer = L.geoJSON(geoJson, {
        style: (feature) => this.geoJsonStyle(feature),
        onEachFeature: (feature, layer) => this.onGeoJsonFeature(feature, layer),
      });

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

  geoJsonStyle(feature) {
    const cityName = feature.properties.name;
    const hasData = this.cityData[cityName];
    return {
      fillColor: hasData ? '#3A6B3A' : '#E8E8E8',
      weight: hasData ? 1.5 : 0.5,
      opacity: 0.5,
      color: hasData ? '#2D5A2D' : '#BBB',
      fillOpacity: hasData ? 0.5 : 0.08,
    };
  }

  onGeoJsonFeature(feature, layer) {
    const cityName = feature.properties.name;
    const hasData = this.cityData[cityName];

    if (hasData) {
      layer.on('click', () => {
        window.router.navigate(`/album/${encodeURIComponent(cityName)}`);
      });
      layer.bindTooltip(`<b>${cityName}</b><br>${this.cityData[cityName].count}张照片`, {
        permanent: false,
        direction: 'top',
        className: 'custom-map-tooltip',
      });
      // Hover effect
      layer.on('mouseover', () => {
        layer.setStyle({
          fillColor: '#2D5A2D',
          fillOpacity: 0.7,
          weight: 2,
        });
      });
      layer.on('mouseout', () => {
        layer.setStyle(this.geoJsonStyle(feature));
      });
    }
  }

  toggleLayerByZoom() {
    const zoom = this.map.getZoom();
    if (zoom <= 6) {
      if (this.markerCluster) this.map.removeLayer(this.markerCluster);
      if (this.geoJsonLayer) this.geoJsonLayer.addTo(this.map);
    } else {
      if (this.geoJsonLayer) this.map.removeLayer(this.geoJsonLayer);
      if (this.markerCluster) this.markerCluster.addTo(this.map);
    }
  }
}
