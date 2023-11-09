# Max Temp Map

## Project Overview

This project is a React.js based web application that visualizes the maximum temperature data on a map, providing a heatmap representation of temperature variations across different regions. The backend is built on Express.js and Node.js, which is responsible for fetching maximum temperature values from a specified API for a given day. It processes this data into a GeoJSON file format, which is then made accessible to the frontend.

The frontend consumes the GeoJSON file and maps the maximum temperature data onto a geographical map. Each data point is correlated with a specific color that indicates the temperature range, creating an intuitive and visually engaging heatmap that reflects the temperature distribution.

I decided to fetch and build my own data using station ID values gathered from the NOAA API. These are then used to query the API for the maximum temperature data for each station.
For details on how I accessed the NOAA data used, see the following documentation - https://www.ncei.noaa.gov/cdo-web/webservices/v2#gettingStarted
<img src="https://johndan2354.github.io/hobbieImages/weathertemps.png" width="900" height="624" />
## Running the Project Locally

### Prerequisites

To run the project, you will need to have Node.js and npm (Node Package Manager) installed on your machine.
Make sure you have a .env file in the project directory that includes the entries from the env_example file.

### Backend Setup

1. Clone the repository and navigate to the project directory:
   ```sh
   git clone <repository-url>
   cd maxtemp-map
   ```

2. Install the necessary npm packages:
   ```sh
   npm install
   ```

3. Start the backend server:
   ```sh
   node src/api/index.js
   ```
   The backend server will generate the initial GeoJSON file needed by the frontend on startup.

### Frontend Setup

1. Open a new terminal and ensure you are in the project directory.

2. Start the React frontend application:
   ```sh
   npm start
   ```
   This will launch the application in your default web browser. If it doesn't open automatically, navigate to http://localhost:3000 in your browser.

## API Endpoint

The backend server exposes the following endpoint for the frontend to retrieve temperature data:

- `/api/fetch-maxtemp` - Serves the GeoJSON file containing the maximum temperature data.

Ensure that the backend server is running, as the frontend relies on this API endpoint to obtain the data for visualization.
