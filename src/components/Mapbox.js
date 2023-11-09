import React, { useState, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl';

import mapStyle from '../assets/mapStyle.json';
import LOCATION_COORDINATES from '../constants/locations';

const API_URL = process.env.REACT_APP_API_URL;

// Retrieve the initial location from .env file
const initialLocationName = process.env.REACT_APP_INITIAL_MAP_LOCATION;

// Fallback to USMID if no location is set in .env or if it's not in the defined keys
const initialCoordinates = LOCATION_COORDINATES[initialLocationName] || LOCATION_COORDINATES['us_mid'];

const Mapbox = () => {
  const [viewport, setViewport] = useState({
    latitude: initialCoordinates.latitude,
    longitude: initialCoordinates.longitude,
    zoom: 5
  });
  const [mTempData, setMTempData] = useState(null); // Store the fetched temperature data
  const [loading, setLoading] = useState(false);

  const fetchTempData = async () => {
    setLoading(true); // Start loading state
    try {
      const response = await fetch(`${API_URL}/api/fetch-maxtemp`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const json = await response.json();
      setMTempData(json);
    } catch (error) {
      console.error('Failed to fetch mTempData:', error);
    } finally {
      setLoading(false); // End loading state
    }
  };

  useEffect(() => {
    fetchTempData();
  }, []);

  // Handle the viewport change
  const handleViewportChange = (newViewport) => {
    setViewport({ ...viewport, ...newViewport });
  };

  const layerStyle = {
    id: 'tmax-temp',
    type: 'circle',
    paint: {
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'maxTemp'],
        30, '#3288bd', // Hot
        70, '#fee08b', // Moderate
        100, '#d53e4f', // Cold
      ],
      'circle-opacity': 0.8,
      'circle-radius': 10
    }
  };

  // Define the layer style for the text labels
  const textLayerStyle = {
    id: 'tmax-temp-text',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'maxTemp'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    },
    paint: {
      'text-color': 'rgba(0,0,0,0.8)', // Set text color
    }
  };

  // Determine if the device is a small device based on its width in a simple manner
  const isSmallDevice = window.innerWidth < 768;
  const mapContainerStyle = isSmallDevice ? { width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 } : { width: 948, height: 500, margin: 'auto' };

  return (
    <div style={mapContainerStyle} className='map-container'>
      <Map
        {...viewport}
        mapStyle={mapStyle}
        onMove={evt => handleViewportChange(evt.viewState)}
      >
        {mTempData && (
          <Source
            id="tmax-source"
            type="geojson"
            data={mTempData}
          >
            <Layer {...layerStyle} />
            <Layer {...textLayerStyle} />
          </Source>
        )}
      </Map>
    </div>
  );
};

export default Mapbox;