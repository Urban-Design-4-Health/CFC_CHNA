// Start the REACT VITE Server
// cmd:  cd BB_MapBoxGL
//       npm run dev
//  open browser:  http://localhost:5173/
//

// Needs:  
//    1. Load a database of metric definitions that change with metric selection
//         a.  metric names
//         b.  metric title
//         c.  metric Description
//         d.  Legend
//    2. Learn how to change the map based on metric selection
//    3. Learn how to add overlay on top of the current Map
//	  4. Add hospital locations to the Map
//    5. Lookup a street address, zoom, to location

// Import components and libraries
import { useRef, useEffect, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import "react-widgets/styles.css";
import DropdownList from "react-widgets/DropdownList";
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'
import 'mapboxgl-legend/dist/style.css';

// load config File
import metfile from '../data/metrics2.json'

// Set constant values
const INITIAL_CENTER = [-81.6, 28.6]
const INITIAL_ZOOM = 9.5

// List of Overlay Maps for Pulldown
const ov_layers = [
  { id: 1, name: "No Overlay", file: "" },
  { id: 2, name: "More than 50% of households are below the federal poverty level", property: "PovFlag" },
  { id: 4, name: "More than 25% of the population are 65 or older", property: "ElderFlag" },
  { id: 5, name: "More than 25% of the population are under the age of 18", property: "YouthFlag" },
  { id: 6, name: "More than 20% of adults do nothave health insurance", property: "NoInsFlag" }
];

// List of Health Metrics for Pulldown
const sel_layers = [
  { id: 1, name: "Adult Unhealthy Behaviors (%)" },
  { id: 2, name: "Adult Chronic Disease (%)" },
  { id: 3, name: "Mental Health Concern (%)" },
  { id: 4, name: "Social Isolation (%)" },
  { id: 5, name: "Walkability" },
  { id: 6, name: "Trauma Center Access" },
  { id: 7, name: "Acute Care Access" },
  { id: 8, name: "Estimated Adult BMI > 30 (NPHAM)" },
  { id: 9, name: "Estimated Adult Type 2 Diabetes Prevalence (NPHAM)" },
  { id: 10, name: "Estimated Adult Coronary Heart Disease Prevalence (NPHAM)" },
  { id: 11, name: "Estimated Cost of Illness (NPHAM)" },
];

// Legend style
const legendStyle = {
  backgroundColor: '#fff',
  borderRadius: '3px',
  bottom: '30px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  font: "16px/20px 'Georgia', Arial, Helvetica, sans-serif",
  padding: '10px',
  position: 'absolute',
  right: '10px',
  zIndex: 1
};

const legendHeadingStyle = {
  margin: '0 0 10px'
};

const legendSpanStyle = {
  borderRadius: '50%',
  display: 'inline-block',
  height: '14px',
  marginRight: '5px',
  width: '10px'
};

// Hospital data
const hospitals = [
  { name: "AdventHealth Orlando", coordinates: [-81.3673, 28.5754], type: "Acute Care" },
  { name: "Orlando Health", coordinates: [-81.3809, 28.5217], type: "Trauma Center" },
  { name: "Nemours Children's Hospital", coordinates: [-81.2801, 28.3968], type: "Acute Care" },
  { name: "AdventHealth Altamonte Springs", coordinates: [-81.3939, 28.6617], type: "Acute Care" },
  { name: "Orlando Health Dr. P. Phillips Hospital", coordinates: [-81.4736, 28.4452], type: "Acute Care" }
];

// Mapping application
function App() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [metricIndex, setMetricIndex] = useState(1);
  const [overlayIndex, setOverlayIndex] = useState(1);
  const [metrics] = useState(metfile);
  const [searchAddress, setSearchAddress] = useState('');
  const [showHospitals, setShowHospitals] = useState(false);

  // Memoize the current metric to avoid unnecessary re-renders
  const currentMetric = useMemo(() => metrics[metricIndex] || metrics[1], [metrics, metricIndex]);
  
  // Handle metric change
  const handleMetricChange = (value) => {
    setMetricIndex(value.id);
  };
  
  // Handle overlay change
  const handleOverlayChange = (value) => {
    setOverlayIndex(value.id);
    
    // Toggle overlay visibility based on selection
    if (mapRef.current) {
      if (value.id === 1) {
        // No overlay selected
        mapRef.current.setLayoutProperty('cbg-olayer', 'visibility', 'none');
      } else {
        // Update overlay filter based on selected property
        const property = ov_layers.find(layer => layer.id === value.id)?.property;
        if (property) {
          mapRef.current.setFilter('cbg-olayer', ['==', property, 1]);
          mapRef.current.setLayoutProperty('cbg-olayer', 'visibility', 'visible');
        }
      }
    }
  };

  // Handle address search
  const handleAddressSearch = (e) => {
    e.preventDefault();
    if (!searchAddress) return;
    
    // Use Mapbox Geocoding API to find the location
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${mapboxgl.accessToken}&proximity=${INITIAL_CENTER[0]},${INITIAL_CENTER[1]}&bbox=-82.5,27.5,-80.5,29.5`)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 15
          });
          
          // Add a marker at the searched location
          const marker = new mapboxgl.Marker({ color: '#FF0000' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${data.features[0].place_name}</h3>`))
            .addTo(mapRef.current);
            
          // Remove the marker after 10 seconds
          setTimeout(() => marker.remove(), 10000);
        } else {
          alert('No location found for that address.');
        }
      })
      .catch(error => {
        console.error('Error searching for address:', error);
        alert('Error searching for address. Please try again.');
      });
  };

  // Toggle hospital markers
  const toggleHospitals = () => {
    setShowHospitals(prev => !prev);
  };
  
  // Main map initialization and update effect
  useEffect(() => {
    // Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoidWQ0aCIsImEiOiJjbDVyNXlmeTEwMGoyM2JwYm9oYnlzc3Q0In0.-DHdTNsriTaq0uGL_BBTYg';

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: INITIAL_CENTER,
        zoom: zoom
      });
      
      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add scale control
      mapRef.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      
      // Add initial sources and layers once the map is loaded
      mapRef.current.on('load', () => {
        // Add sources
        mapRef.current.addSource('CBGs', {
          type: 'geojson',
          data: './data/Metrics_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('Water', {
          type: 'geojson',
          data: './data/Water_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('PAD', {
          type: 'geojson',
          data: './data/PAD_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('ZR', {
          type: 'geojson',
          data: './data/ZeroPop_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('CNTY', {
          type: 'geojson',
          data: './data/County_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('RDS', {
          type: 'geojson',
          data: './data/Roads_for_website_4326.geojson'
        });
        
        // Add layers
        mapRef.current.addLayer({
          id: 'cbg-layer',
          type: 'fill',
          source: 'CBGs',
          layout: {},
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', currentMetric.Field],
              0, "#fab846",
              currentMetric.t1, "#fab846",
              currentMetric.t1+0.000001, "#ffe1ad",
              currentMetric.t2, "#ffe1ad",
              currentMetric.t2+0.000001, "#d2a6f7",
              currentMetric.t3, "#d2a6f7",
              currentMetric.t3+0.000001, "#8c32d9",
              currentMetric.t4, "#8c32d9",
              currentMetric.t4+0.000001, "#4f048f",
              currentMetric.t5, "#4f048f"
            ],
            'fill-opacity': 0.8
          }
        });
        
        // Add zero population layer
        mapRef.current.addLayer({
          id: 'zeropop-layer',
          type: 'fill',
          source: 'ZR',
          layout: {},
          paint: {
            'fill-color': "darkgrey",
            'fill-opacity': 0.9
          }
        });
        
        // Add PAD layer
        mapRef.current.addLayer({
          id: 'pad-layer',
          type: 'fill',
          source: 'PAD',
          layout: {},
          paint: {
            'fill-color': "darkgrey",
            'fill-opacity': 0.9
          }
        });
        
        // Add water layer
        mapRef.current.addLayer({
          id: 'water-layer',
          type: 'fill',
          source: 'Water',
          layout: {},
          paint: {
            'fill-color': "#aad2e3",
            'fill-opacity': 1
          }
        });
        
        // Add roads layer
        mapRef.current.addLayer({
          id: 'roads-layer',
          type: 'line',
          source: 'RDS',
          layout: {},
          paint: {
            'line-color': "#30302f",
            'line-width': 0.5,
            'line-opacity': 1
          }
        });
        
        // Add county boundary layer
        mapRef.current.addLayer({
          id: 'CNTY-layer',
          type: 'line',
          source: 'CNTY',
          layout: {},
          paint: {
            'line-color': "black",
            'line-width': 2,
            'line-opacity': 1
          }
        });
        
        // Add county label layer
        mapRef.current.addLayer({
          id: 'CNTY-label',
          type: 'symbol',
          source: 'CNTY',
          layout: {
            'text-field': ['get', 'CountyName'],
            'text-font': ['Open Sans Bold'],
            'text-size': 16,
            'text-anchor': 'center',
          },
          minzoom: 1,
          maxzoom: 10,
          paint: {
            'text-color': "red"
          }
        });
        
        // Add 3D buildings layer
        mapRef.current.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        });
        
        // Add overlay layer (initially hidden)
        mapRef.current.addLayer({
          id: 'cbg-olayer',
          type: 'fill',
          source: 'CBGs',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'fill-color': '#c90202',
            'fill-opacity': 0.5
          }
        });
        
        // Set up click interaction for CBGs
        mapRef.current.on('click', 'cbg-layer', (e) => {
          // Get properties for the current metric
          const feature = e.features[0];
          const properties = feature.properties;
          
          // Create popup content based on the current metric
          let popupContent = `<h3>${currentMetric.Metric}</h3>`;
          
          // Add specific metrics based on the selected layer
          if (metricIndex === 1) {
            // Adult Unhealthy Behaviors
            popupContent += `<p>Smokers: ${parseFloat(properties.A_Smokers*100).toFixed(1)}%</p>`;
            popupContent += `<p>Binge Drinkers: ${parseFloat(properties.A_BingeDrink*100).toFixed(1)}%</p>`;
            popupContent += `<p>No Physical Activity: ${parseFloat(properties.A_NoPhysAct*100).toFixed(1)}%</p>`;
          } else {
            // For other metrics, show the main value
            const value = properties[currentMetric.Field];
            popupContent += `<p>Value: ${parseFloat(value).toFixed(2)}</p>`;
          }
          
          // Add additional demographic info
          popupContent += `<hr><p>Population: ${properties.TotalPop}</p>`;
          popupContent += `<p>Households: ${properties.TotalHH}</p>`;
          
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(mapRef.current);
        });
        
        // Change cursor on hover
        mapRef.current.on('mouseenter', 'cbg-layer', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        
        mapRef.current.on('mouseleave', 'cbg-layer', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
      });
    }
    
    // Cleanup function
    return () => {
      // Clear any existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
      }
    };
  }, []);

  // Effect to update the map when metric changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded() && currentMetric) {
      // Update the fill color expression for the CBG layer
      mapRef.current.setPaintProperty('cbg-layer', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', currentMetric.Field],
        0, "#fab846",
        currentMetric.t1, "#fab846",
        currentMetric.t1+0.000001, "#ffe1ad",
        currentMetric.t2, "#ffe1ad",
        currentMetric.t2+0.000001, "#d2a6f7",
        currentMetric.t3, "#d2a6f7",
        currentMetric.t3+0.000001, "#8c32d9",
        currentMetric.t4, "#8c32d9",
        currentMetric.t4+0.000001, "#4f048f",
        currentMetric.t5, "#4f048f"
      ]);
    }
  }, [metricIndex, currentMetric]);

  // Effect to handle hospital markers
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (showHospitals) {
        // Add hospital markers
        hospitals.forEach(hospital => {
          const el = document.createElement('div');
          el.className = 'hospital-marker';
          el.style.backgroundImage = hospital.type === 'Trauma Center' 
            ? 'url(./graphics/trauma-marker.png)' 
            : 'url(./graphics/hospital-marker.png)';
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.backgroundSize = 'cover';
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat(hospital.coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${hospital.name}</h3><p>${hospital.type}</p>`))
            .addTo(mapRef.current);
          
          markersRef.current.push(marker);
        });
      }
    }
  }, [showHospitals]);

  return (
    <>
      {/* Titlebar */}
      <div className="titlebar">
        <p className="pageTitle">Central Florida Collaborative</p>
        <p className="pageSubtitle">2024 Community Health Needs Assessment</p>
      </div>
      
      {/* Health Metric Description */}
      <div className="sidebar2">
        <div dangerouslySetInnerHTML={{__html: currentMetric.Description}} />
      </div>
      
      {/* Health Metric Selection Widget */}
      <div className="slayer">
        <h3>Select Health Metric:</h3>
        <DropdownList
          id="selMetric"
          data={sel_layers}
          dataKey='id'
          textField='name'
          defaultValue={sel_layers[0]}
          onChange={handleMetricChange}
        />
      </div>
      
      {/* Overlay Option Widget */}
      <div className="overlay">
        <h3>Select Overlay:</h3>
        <DropdownList
          id="selOverlay"
          data={ov_layers}
          dataKey='id'
          textField='name'
          defaultValue={ov_layers[0]}
          onChange={handleOverlayChange}
        />
      </div>
      
      {/* Address Search */}
      <div className="address-search">
        <h3>Find Location:</h3>
        <form onSubmit={handleAddressSearch}>
          <input 
            type="text" 
            placeholder="Enter address..." 
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      
      {/* Hospital Toggle */}
      <div className="hospital-toggle">
        <button onClick={toggleHospitals}>
          {showHospitals ? 'Hide Hospitals' : 'Show Hospitals'}
        </button>
      </div>

      {/* CFC Logo */}
      <div className="CFC_logo">
        <img src={'./graphics/CFC_logo.png'} height={120} alt="CFC Logo" />
      </div>
      
      {/* UD4H Logo */}
      <div className="UD4H_logo">
        <img src={'./graphics/UD4H_logo.png'} height={90} alt="UD4H Logo" />
      </div>
      
      {/* Map container */}
      <div id='map-container' ref={mapContainerRef} />
      
      {/* Legend */}
      <div id="cbg-legend" className="legendStyle" style={legendStyle}>
        <h3 style={legendHeadingStyle}>{currentMetric.Metric}</h3>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#fab846" }}></span>
          {currentMetric.l1}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#ffe1ad" }}></span>
          {currentMetric.l2}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#e6cafc" }}></span>
          {currentMetric.l3}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#8c32d9cc" }}></span>
          {currentMetric.l4}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#4f048f" }}></span>
          {currentMetric.l5}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "darkgrey" }}></span>
          No residential population
        </div>
        
        {/* Overlay Legend - only show if an overlay is active */}
        {overlayIndex !== 1 && (
          <>
            <h3 style={{...legendHeadingStyle, marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '10px'}}>
              Overlay
            </h3>
            <div>
              <span style={{ ...legendSpanStyle, backgroundColor: "#c90202" }}></span>
              {ov_layers.find(layer => layer.id === overlayIndex)?.name}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App