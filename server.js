const http = require('http');
const fs = require('fs');
const axios = require('axios');
const CONFIG = require('./config');
const CACHE_FILE = './data.json';
const CACHE_LIFETIME = 60 * 60 * 1000; // 1 hour in milliseconds

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const axiosConfig = {
    mode: 'no-cors',
    headers: {
      "Authorization": 'APIKEY ' + CONFIG.THREADFIX_APIKEY
    }
  }

  function fetchDataFromApi(callback) {
    axios.get(CONFIG.THREADFIX_BASEURL + 'rest/latest/applications', axiosConfig)
      .then(function (response) {
        callback(null, response.data)
      })
      .catch(function (error) {
        callback(error)
      })
  }

  function cacheData(data) {
    const cache = {
      timestamp: Date.now(),
      data: data
    };
    fs.writeFile(CACHE_FILE, JSON.stringify(cache), (error) => {
      if (error) {
        console.log("File write error", error);
      } else {
        console.log('Data cached successfully');
      }
    });
  }

  function getCachedData(callback) {
    fs.readFile(CACHE_FILE, (error, data) => {
      if (!error && data.toString().trim()) {
        const cache = JSON.parse(data);
        const age = Date.now() - cache.timestamp;
        if (age < CACHE_LIFETIME) {
          console.log("Serving from cache!")
          callback(null, cache.data);
        } else {
          console.log('Cache expired, fetching data from API');
          fetchDataFromApi((error, data) => {
            if (!error) {
              cacheData(data);
            }
            callback(error, data);
          });
        }
      } else {
        console.log('Cache file not found, fetching data from API');
        fetchDataFromApi((error, data) => {
          if (!error) {
            cacheData(data);
          }
          callback(error, data);
        });
      }
    });
  }

  console.log("fetching data from cache or api...")

  getCachedData((error, data) => {
    if (error) {
      console.log("ERROR", error);

      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('An error occurred');
    } else {
      // Set the response header to indicate that the response will be in JSON format
      res.writeHead(200, { 'Content-Type': 'application/json' });

      // Send the JSON data as the response
      res.end(JSON.stringify(data));
    }
  });
});

const PORT = 9876
server.listen(PORT, '0.0.0.0');
console.log('Server running at http://localhost:' + PORT + '/');
