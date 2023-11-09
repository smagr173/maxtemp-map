const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());

const API_KEY = 'uzjIzegMsRuvKkSvuVLvahtKoueNtZCA';
const BASE_URL = 'https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&datatypeid=TMAX&units=standard';

// Helper function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch temperature data in batches
async function fetchTempData(stationIds, start, end) {
  const allResults = [];
  const limit = 1000; // API limit per request
  const batchSize = 200;

  // Split the station IDs into batches
  const batches = [];
  for (let i = 0; i < stationIds.length; i += batchSize) {
    batches.push(stationIds.slice(i, i + batchSize));
  }

  // Loop through each batch and fetch data
  for (const [index, batch] of batches.entries()) {
    let offset = 0; // Reset offset for each batch

    while (true) { // Keep fetching until no more data is available for the batch
      try {
        const batchStationIds = batch.join(',');
        // See docs for API here - https://www.ncei.noaa.gov/cdo-web/webservices/v2#data
        let url = `${BASE_URL}&stationid=${batchStationIds}&startdate=${start}&enddate=${end}&limit=${limit}&offset=${offset}`;
        
        const response = await axios.get(url, { headers: { 'Token': API_KEY } });

        // Check response structure
        if (response.data && response.data.metadata && response.data.results) {
          allResults.push(...response.data.results);
          const { count } = response.data.metadata.resultset;
          
          if (count < limit) {
            break; // Exit the loop if we've fetched all available data for the batch
          }
          offset += limit; // Prepare offset for the next batch of data
        } else {
          break; // Exit loop on unexpected response structure
        }

        if (index < batches.length - 1 || offset < stationIds.length) {
          await delay(205); // Respect the API rate limit
        }
      } catch (error) {
        break; // Exit loop on error
      }
    }
  }

  console.log('Finished fetching all data');
  return allResults;
}

// Load station info from JSON file
async function loadStationInfo() {
  // Contains real station ID's and their coordinates. Having this makes the query for temperature data a lot easier
  const data = await fs.readFile('us_stations.json', 'utf8');
  return JSON.parse(data);
}

// Path to the GeoJSON file
const geoJsonFilePath = path.resolve(__dirname, 'max_temp_data.geojson');

async function generateAndSaveGeoJSON() {
  try {
    const stationInfo = await loadStationInfo();
    const startDate = '2023-11-04T00:00:00';  // In production we can make this live but this will do for now
    const endDate = '2023-11-04T23:59:59';
    const tempData = await fetchTempData(stationInfo.map(station => station.id), startDate, endDate);

    // Reduce the tempData to the latest entry per station
    const latestTempData = tempData.reduce((acc, temp) => {
      const existing = acc.find(t => t.station === temp.station);
      if (!existing || new Date(temp.date) > new Date(existing.date)) {
        acc = acc.filter(t => t.station !== temp.station); // Remove existing entry if it's older
        acc.push(temp); // Add the latest entry
      }
      return acc;
    }, []);

    // Combine station info with temp data into GeoJSON
    const geoJson = {
      type: "FeatureCollection",
      features: latestTempData.map(temp => {
        const station = stationInfo.find(s => s.id === temp.station);
        if (!station) {
          console.warn(`No station info found for station ID: ${temp.station}`);
          return null; // Skip this feature
        }
        return {
          type: "Feature",
          properties: {
            stationId: temp.station,
            maxTemp: temp.value
          },
          geometry: {
            type: "Point",
            coordinates: [station.longitude, station.latitude]
          }
        };
      }).filter(feature => feature !== null) // Remove null features where station info was not found
    };

    // Write the GeoJSON to a file on the server
    await fs.writeFile(geoJsonFilePath, JSON.stringify(geoJson), 'utf8');
    console.log('GeoJSON data has been saved');

  } catch (error) {
    console.error('Error generating mTempData: ', error);
    res.status(500).send('Error generating mTempData');
  }
};

// Endpoint for access to the max temperature data
app.get('/api/fetch-maxtemp', async (req, res) => {
  try {
    // Check if the file exists
    await fs.access(geoJsonFilePath);
    // Serve the GeoJSON file
    res.sendFile(geoJsonFilePath);
  } catch (error) {
    // If the file does not exist or there is an error, return 404
    console.error('GeoJSON file not found: ', error);
    res.status(404).send('GeoJSON file not found');
  }
});

// For these purposes, when the server starts generate the file for the frontend.
// In production, we'd regenerate every hour to have the most recent data being displayed.
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  try {
    // Check if the file exists
    await fs.access(geoJsonFilePath);
    console.log('Data file is already generated');
  } catch (error) {
    // If the file does not exist or there is an error, generate the file
    console.log('Generating file..');
    await generateAndSaveGeoJSON();
  }
});
