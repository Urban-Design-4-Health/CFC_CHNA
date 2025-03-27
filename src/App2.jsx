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
import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import "react-widgets/styles.css";
import Collapsible from 'react-collapsible';
import Listbox from "react-widgets/Listbox";
import DropdownList from "react-widgets/DropdownList";
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'

// Set constant values //////////////////////////////////
const INITIAL_CENTER = [
  -81.7,
  28.6
]
const INITIAL_ZOOM = 8

// List of Overlay Maps for Pulldown
const ov_layers = [
  { id: 1, name: "No Overlay", file: "" },
  { id: 2, name: "More than 50% with annual household income less than $50k", file: "./data/Income.geojson" },
  { id: 3, name: "More than 50% over age 65", file: "./data/Seniors.geojson" },
  { id: 4, name: "More than 50% are non-white", file: "./data/Nonwhite.geojson" },
];

// List of Health Metrics for Pulldown - needs to come from a loaded file
const sel_layers = [
  { id: 1, name: "Adult Unhealthy Behaviors (%)" },
  { id: 2, name: "Adult Chronic Disease (%)" },
  { id: 3, name: "Adult Mental Health (%)" },
  { id: 4, name: "Adult Social Isolation (%)" },
  { id: 5, name: "Environmental Burden Index (values: 1:100)" },
  { id: 6, name: "Access to Health-related services" },
  { id: 7, name: "Estimated Adult Obesity Prevalence (NPHAM)" },
  { id: 8, name: "Estimated Adult Type 2 Diabetes Prevalence (NPHAM)" },
  { id: 9, name: "Estimated Adult Coronary Heart Disease Prevalence (NPHAM)" },
  { id: 10, name: "Estimated Adult Hypertension Prevalence (NPHAM)" },
  { id: 11, name: "Estimated Adult Depression Prevalence (NPHAM)" },
  { id: 12, name: "Estimated Cost of Illness (NPHAM)" },
];
////////////////////////////////////////////////////////////////


///////// Functions ////////////////////////////////////////////


// Mapping application
function App() {
  const mapRef = useRef()
  const mapContainerRef = useRef()
  const [center, setCenter] = useState(INITIAL_CENTER)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [o_value, setValue] = useState(1);
  const [selectedValue, setSelectedValue] = useState('');



  // Defines all of the user interactive elements
  useEffect(() => {
	// mapbox access token
	mapboxgl.accessToken = 'pk.eyJ1IjoidWQ0aCIsImEiOiJjbDVyNXlmeTEwMGoyM2JwYm9oYnlzc3Q0In0.-DHdTNsriTaq0uGL_BBTYg'

	// Draw map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
	  style: 'mapbox://styles/ud4h/cm3q726bj004d01s5hv2efywu',
      center: center,
      zoom: zoom
    });
   
  // Close all layers when selecting a new overlay
  const closeAllLayers = () => {
    if (mapRef) {
      const layers = mapRef.getStyle().layers;
      layers.forEach((layer) => {
        if (layer.id !== 'background') { // Exclude the background layer
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      });
    }
  };

  // Load invisble background map for use in mouse identify
    mapRef.current.on('load', () => {
      mapRef.current.addSource('CBGs', {
        type: 'geojson',
        data: './data/CHNA_central_CBG.geojson'
      });
     mapRef.current.addLayer({
        id: 'cbg-layer',
        type: 'fill',
        source: 'CBGs',
        layout: {},
        paint: {
          'fill-color': '#627BC1',
          'fill-opacity': 0
        }
      });
     });
	
	// Load the possible overlay layers
    mapRef.current.on('load', () => {
      mapRef.current.addSource('J40', {
        type: 'geojson',
        data: './data/Justice40.geojson'
      });
	});
	mapRef.current.on('load', () => {
      mapRef.current.addSource('Sen', {
        type: 'geojson',
        data: './data/Seniors.geojson'
      });
	});
	mapRef.current.on('load', () => {
      mapRef.current.addSource('NW', {
        type: 'geojson',
        data: './data/Nonwhite.geojson'
      });
	});
	
    // On map click, show feature values 
	mapRef.current.on('click', 'cbg-layer', (e) => {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML("<p><h3>Unhealthy Behaviors:</h3></p>" + "<p>Smokers: " + parseFloat(e.features[0].properties.A_Smokers*100).toFixed(1) + "%</p>" + "<p>Binge Drinkers: " + parseFloat(e.features[0].properties.A_BingeDrink*100).toFixed(1) + "%</p>" + "<p>No Physical Activity: " + parseFloat(e.features[0].properties.A_NoPhysAct*100).toFixed(1) + "%</p>" + "<i>Unhealthy Index Score (0-4): " + e.features[0].properties.Unhealthy_Behavior_Index + "</i>")
          .addTo(mapRef.current);
      });

     // change the mouse pointer if over a clickable feature 
     mapRef.current.on('mouseenter', 'cbg-layer', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });
     // change mouse pointer back to defauly on leaving a clickable feature
     mapRef.current.on('mouseleave', 'cbg-layer', () => {
        mapRef.current.getCanvas().style.cursor = '';
      });
    
	// Trying to get a reaction when an overlay value is slected
    if (selectedValue) {
		  console.log('Selected value:', selectedValue);
		  // Do something with the selectedValue, e.g., fetch data from API
		};

    return () => {
      mapRef.current.remove()
    }
  }, [])

 
  return (
    <>
	{/* Titlebar */}
    <div className="titlebar">
		<p className="pageTitle">Central Florida Collaborative</p>
        <p className="pageSubtitle">2024 Community Health Needs Assessment </p>
    </div>
	
	{/* Health Metric Description */}
	<div className="sidebar2">
	   <h2>  Unhealthy Behaviors Index </h2> // <p>The Unhealthy Behaviors Index combines three topics from the 2024 CDC PLACES dataset and is estimated from the 2022 BRFSS:</p><p><b>Current Smokers:</b> Percentage of adults that reported smoking some days currently. Cigarette smoking and secondhand smoke exposure cause more than 480,000 deaths each year in the United States. This is nearly one in five deaths.</p><p><b>Binge Drinking:</b> The percentage of adults that reported drinking more than 5 drinks (4 drinks for women) on one occasion during the past 12 months. Drinking excessively can lead to injuries, violence, poisoning, and overdose.</p><p><b>No Leisure Time Physical Activity:</b> The percentage of adults who reported zero physical activity during their leisure time. Regular physical activity elicits multiple health	benefits incuding the prevention and management of chronic diseases.</p>
	</div>
	
	
	{/* Health Metric Selection Widget */}
	<div className="slayer">
	    <p> <h3>  Select Health Metric: </h3> 
        </p>
		<DropdownList
			data={sel_layers}
			dataKey='id'
			textField='name'
			defaultValue={""}
		/>
	</div>
	
	{/* Overlay Option Widget */}
	<div className="overlay">
	    <p> <h3>  Select Overlay: </h3> 
        </p>
		<DropdownList
		    id="selOverlay"
			data={ov_layers}
			dataKey='id'
			textField='name'
			defaultValue={1}
		/>
	</div>

	{/* Health Metric Map Legend */}
	<div className="mapLegend">
	     <img src={'./data/Unhealthy_Behavior_Index/Unhealthy_Behavior_Index_Legend.jpg'} height={130} />
	</div>
	
	{/* CFC Logo */}
	<div className="CFC_logo">
	     <img src={'./graphics/CFC_logo.png'} height={90} />
	</div> 
	
    {/* UD4H Logo */}
	<div className="UD4H_logo">
	     <img src={'./graphics/UD4H_logo.png'} height={60} />
	</div> 
	
    {/* Map container */}
	<div id='map-container' ref={mapContainerRef} />


    </>
  )
}

export default App