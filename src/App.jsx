// Start the REACT VITE Server
// cmd:  cd BB_MapBoxGL
//       npm run dev
//  open browser:  http://localhost:5173/
//

//mapboxgl.accessToken = 'pk.eyJ1IjoidWQ0aCIsImEiOiJjbDVyNXlmeTEwMGoyM2JwYm9oYnlzc3Q0In0.-DHdTNsriTaq0uGL_BBTYg';

// Import components and libraries
import { useRef, useEffect, useState, useMemo } from 'react'
import mapboxgl from "mapbox-gl";
import "react-widgets/styles.css";
import DropdownList from "react-widgets/DropdownList";
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'
import 'mapboxgl-legend/dist/style.css';

// load config File
import metfile from '../data/metrics.json';

// load image fileSize
import CFClogo from './assets/CFC_logo.png';
import UD4Hlogo from './assets/Logo2.png';
import RedHatch from './assets/red_thin.png';
import HatchLeg from './assets/hatch_leg.png';

// load geojson
//import METRICS from '../data/Metrics_for_website_4326.geojson?raw';

// Set constant values
const INITIAL_CENTER = [-81.6, 28.6]
const INITIAL_ZOOM = 9.5

// List of Overlay Maps for Pulldown
const ov_layers = [
  { id: 1, name: "No Overlay", file: "" },
  { id: 2, name: "Poverty: 20%+ of households below the federal poverty level", property: "PovFlag" },
  { id: 4, name: "Seniors: 20%+ of population is 65 or older", property: "SenFlag" },
  { id: 5, name: "Youth:  25% of population aged 18 or younger", property: "ChildFlag" },
  { id: 6, name: "Walkability: score is 14+ out of 20 (high)", property: "WalkFlag" }
];

// List of Health Metrics for Pulldown
const sel_layers = [
  { id: 0, name: "Adult Unhealthy Behaviors (%)" },
  { id: 1, name: "Adult Chronic Disease (%)" },
  { id: 2, name: "Mental Health Concern (%)" },
  { id: 3, name: "Social Isolation (%)" },
  { id: 4, name: "Walkability" },
  { id: 5, name: "Acute Care Access"},
  { id: 6, name: "Trauma Center Access"},
  { id: 7, name: "Estimated Adult BMI > 30 (NPHAM)" },
  { id: 8, name: "Estimated Adult Type 2 Diabetes Prevalence (NPHAM)" },
  { id: 9, name: "Estimated Adult Coronary Heart Disease Prevalence (NPHAM)" },
  { id: 10, name: "Estimated Cost of Illness (NPHAM)" },
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

// Mapping application
function App() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [metricIndex, setMetricIndex] = useState(0);
  const [overlayIndex, setOverlayIndex] = useState(1);
  const [metrics] = useState(metfile);

  // Memorize the current metric to avoid unnecessary re-renders
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

  
  // Main map initialization and update effect
  useEffect(() => {
    // Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoidWQ0aCIsImEiOiJjbDVyNXlmeTEwMGoyM2JwYm9oYnlzc3Q0In0.-DHdTNsriTaq0uGL_BBTYg';

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/standard', // 'mapbox://styles/mapbox/light-v11',
        center: INITIAL_CENTER,
        zoom: zoom
      });
      
      
      // Add initial sources and layers once the map is loaded
      mapRef.current.on('load', () => {
        // Add Metrics
        mapRef.current.addSource('CBGs', {
          type: 'geojson',
          data: '/data/Metrics_for_website_4326.geojson'
        });
		
        
        mapRef.current.addSource('Water', {
          type: 'geojson',
          data: '/data/Water_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('PAD', {
          type: 'geojson',
          data: '/data/PAD_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('ZR', {
          type: 'geojson',
          data: '/data/ZeroPop_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('CNTY', {
          type: 'geojson',
          data: '/data/County_for_website_4326.geojson'
        });
        
        mapRef.current.addSource('RDS', {
          type: 'geojson',
          data: '/data/Roads_for_website_4326.geojson'
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
              0, currentMetric.c1,
              currentMetric.t1, currentMetric.c1,
              currentMetric.t1+0.000001, currentMetric.c2,
              currentMetric.t2, currentMetric.c2,
              currentMetric.t2+0.000001, currentMetric.c3,
              currentMetric.t3, currentMetric.c3,
              currentMetric.t3+0.000001, currentMetric.c4,
              currentMetric.t4, currentMetric.c4,
              currentMetric.t4+0.000001, currentMetric.c5,
              currentMetric.t5, currentMetric.c5
            ],
            'fill-opacity': .8
          }
        });
		
		// Add Overlay
        mapRef.current.addSource('OL', {
          type: 'geojson',
          data: '/data/Metrics_for_website_4326.geojson'
        });
		
	    // Add overlay pattern
        mapRef.current.loadImage(
		   RedHatch,
		   (error, image) => {
                if (error) throw error;
		        mapRef.current.addImage('hatched-pattern', image);
		   }
		  );
		
		

        
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
        

        mapRef.current.addLayer({
          id: 'cbg-olayer',
          type: 'fill',
          source: 'OL',
          paint: {
            'fill-pattern': 'hatched-pattern',
            'fill-opacity': 1,
            },
		 layout: {
            'visibility': 'none'
		    }
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
    if (mapRef.current && mapRef.current.isStyleLoaded()) {

      const currentLayer = mapRef.current.getLayer('cbg-layer');
      if (currentLayer) {
        // Adjust the map layer's paint properties to use the selected metric
        mapRef.current.setPaintProperty('cbg-layer', 'fill-color', [
          'interpolate',
          ['linear'],
          ['get', currentMetric.Field],
          0, currentMetric.c1,
              currentMetric.t1, currentMetric.c1,
              currentMetric.t1+0.000001, currentMetric.c2,
              currentMetric.t2, currentMetric.c2,
              currentMetric.t2+0.000001, currentMetric.c3,
              currentMetric.t3, currentMetric.c3,
              currentMetric.t3+0.000001, currentMetric.c4,
              currentMetric.t4, currentMetric.c4,
              currentMetric.t4+0.000001, currentMetric.c5,
              currentMetric.t5, currentMetric.c5
        ]);
      }
    }
// Remove any existing click listeners first
  mapRef.current.off('click', 'cbg-layer');


  mapRef.current.on('click', 'cbg-layer', (e) => {
  // Get properties for the current metric
  
  const existingPopup = document.querySelector('.mapboxgl-popup');
      if (existingPopup) {
        existingPopup.remove();
      }
  
  const feature = e.features[0];
  const properties = feature.properties;
  
  // Create popup content based on the current metric
  let popupContent = `<h3>${currentMetric.Metric}</h3>`;
  
  // Dynamically generate popup content based on the current metric
  switch(metricIndex) {
    case 0: // Adult Unhealthy Behaviors
      popupContent += `
        <p>Smokers: ${parseFloat(properties.A_Smokers*100).toFixed(1)}%</p>
        <p>Binge Drinkers: ${parseFloat(properties.A_BingeDrink*100).toFixed(1)}%</p>
        <p>No Physical Activity: ${parseFloat(properties.A_NoPhysAct*100).toFixed(1)}%</p>
      `;
      break;
    
    case 1: // Adult Chronic Disease
      popupContent += `
        <p>Cancer: ${parseFloat(properties.A_Cancer*100).toFixed(1)}%</p>
        <p>Heart Disease: ${parseFloat(properties.A_CHD*100).toFixed(1)}%</p>
        <p>Diabetes: ${parseFloat(properties.A_DIA*100).toFixed(1)}%</p>
        <p>Obesity: ${parseFloat(properties.A_BMI30*100).toFixed(1)}%</p>
        <p>Asthma: ${parseFloat(properties.A_Asthma*100).toFixed(1)}%</p>
      `;
      break;
    
    case 2: // Adult Mental Health
      popupContent += `
        <p>Depression: ${parseFloat(properties.A_Depression*100).toFixed(1)}%</p>
        <p>Distress: ${parseFloat(properties.A_Distress*100).toFixed(1)}%</p>
      `;
      break;
    
    case 3: // Social Isolation
      popupContent += `
        <p>Social Isolation: ${parseFloat(properties.A_SocIso*100).toFixed(1)}%</p>
        <p>Adults Living Alone: ${parseFloat(properties.P_AdultAlone*100).toFixed(1)}%</p>
        <p>Seniors Living Alone: ${parseFloat(properties.P_SeniorAlone*100).toFixed(1)}%</p>
      `;
      break;
    
    case 4: // Walkability
      popupContent += `
        <p>Walkability Score (out of 20): ${parseFloat(properties.NWI).toFixed(1)}</p>
      `;
      break;

    case 5: // Acute Care Access
      popupContent += `
        <p>Travel Time by Car to Acute Care: ${parseFloat(properties.HospitalTT).toFixed(1)} Minutes</p>
      `;
      break;
	  
    case 6: // Trauma Center Access
      popupContent += `
        <p>Travel Time by Car to Trauma Center: ${parseFloat(properties.TraumaTT).toFixed(1)} Minutes</p>
      `;
      break;
    
    case 7: // NPHAM Estimated Adult BMI > 30
      popupContent += `
        <p>Estimated Adult BMI > 30: ${parseFloat(properties.A_NPHAM_Obese*100).toFixed(1)}%</p>
      `;
      break;
    
    case 8: // NPHAM Type 2 Diabetes
      popupContent += `
        <p>Estimated Type 2 Diabetes: ${parseFloat(properties.A_NPHAM_T2DIA*100).toFixed(1)}%</p>
      `;
      break;
    
    case 9: // NPHAM Coronary Heart Disease
      popupContent += `
        <p>Estimated Heart Disease: ${parseFloat(properties.A_NPHAM_CHD*100).toFixed(1)}%</p>
      `;
      break;
    
    case 10: // Estimated Cost of Illness
      popupContent += `
        <p>Average Cost of Illness: $${parseFloat(properties.A_NPHAM_MeanCOI).toFixed(1)}</p>
      `;
      break;
    
    default:
      popupContent += '<p>No specific details available for this metric.</p>';
  }
  
  // Add additional demographic info
  popupContent += `
    <hr>
    <p>Population: ${properties.Population}</p>
    <p>Households: ${properties.Households}</p>
  `;
  
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(popupContent)
    .addTo(mapRef.current);
});
	
}, [metricIndex, currentMetric]);

  // Effect to update the map when the overlay changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      // Hide or show the overlay layer based on the selected overlay
      if (overlayIndex === 1) {
        // No overlay, hide it
        mapRef.current.setLayoutProperty('cbg-olayer', 'visibility', 'none');
      } else {
        // Show overlay based on the selected property
        const property = ov_layers.find(layer => layer.id === overlayIndex)?.property;
        if (property) {
          mapRef.current.setFilter('cbg-olayer', ['==', property, overlayIndex]);
          mapRef.current.setLayoutProperty('cbg-olayer', 'visibility', 'visible');
        }
      }
    }
}, [overlayIndex]);


 return (
    <>
	  {/* Titlebar */}
      <div className="titlebar">
        <p className="pageTitle">Central Florida Collaborative</p>
        <p className="pageSubtitle">2025 Community Health Needs Assessment</p>
		<p className="pageSubtitle2">Neighborhood Health Metrics</p>
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
		
      {/* CFC Logo */}
      <div className="CFC_logo">
        <img src={CFClogo} height={120} alt="CFC Logo" />
      </div>
      
      {/* UD4H Logo */}
      <div className="UD4H_logo">
        <a href="https://urbandesign4health.com" target="_blank" rel="noopener noreferrer">
           <img src={UD4Hlogo} height={120} alt="UD4H Logo" />
        </a>
      </div>
      
      {/* Map container */}
      <div id='map-container' ref={mapContainerRef} />
      
      {/* Legend */}
      <div id="cbg-legend" className="legendStyle" style={legendStyle}>
        <h3 style={legendHeadingStyle}>{currentMetric.Metric}</h3>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#fca503" }}></span>
          {currentMetric.l1}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#fad087" }}></span>
          {currentMetric.l2}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#e6cafc" }}></span>
          {currentMetric.l3}
        </div>
        <div>
          <span style={{ ...legendSpanStyle, backgroundColor: "#c587fa" }}></span>
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
            </h3> 
            <div>
			  <img src={HatchLeg} width="20" style={{ marginRight: '10px',
			                                                         verticalAlign: 'top'}}/>
              <span style={{ wordWrap: 'break-word', maxWidth: '220px', display: 'inline-block' }}>
                  {ov_layers.find(layer => layer.id === overlayIndex)?.name}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
