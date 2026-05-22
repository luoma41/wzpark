class MapComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markerCluster = null;
    this.geoJsonLayer = null;
  }

  async init() {
    if (!this.container) return;

    this.map = L.map(this.container, {
      center: [35.8617, 104.1954],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
    });

    // Light tile layer for minimal style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Load China city-level GeoJSON and map data
    await this.loadMapData();

    // Zoom listener to toggle between GeoJSON and markers
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

      // GeoJSON layer
      this.geoJsonLayer = L.geoJSON(geoJson, {
        style: (feature) => this.geoJsonStyle(feature),
        onEachFeature: (feature, layer) => this.onGeoJsonFeature(feature, layer),
      });

      // Marker cluster layer
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
      fillColor: hasData ? '#5A7D5A' : '#E5E5E5',
      weight: 1,
      opacity: 0.3,
      color: '#999',
      fillOpacity: hasData ? 0.4 : 0.1,
    };
  }

  onGeoJsonFeature(feature, layer) {
    const cityName = feature.properties.name;
    if (this.cityData[cityName]) {
      layer.on('click', () => {
        window.router.navigate(`/album/${encodeURIComponent(cityName)}`);
      });
      layer.bindTooltip(`${cityName} (${this.cityData[cityName].count}张)`, { permanent: false });
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
