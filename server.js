const http = require('http');
const axios = require('axios');
const CONFIG = require('./config');

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
    if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}

    try {
        const axiosConfig = {
            mode: 'no-cors',
            headers:{
                "Authorization": 'APIKEY ' + CONFIG.THREADFIX_APIKEY
            }
        }
        
        const response = await axios.get(CONFIG.THREADFIX_BASEURL + 'rest/latest/applications',  axiosConfig);
        const data = response.data;
        // console.log("DATA", data)

        // Set the response header to indicate that the response will be in JSON format
        res.writeHead(200, { 'Content-Type': 'application/json' });

        // Send the JSON data as the response
        res.end(JSON.stringify(data));
    } catch (error) {
        console.log("Error: ", error)
        // If there was an error making the request or parsing the response, send an error message
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('An error occurred');
    }
});

const PORT = 9876
server.listen(PORT, '0.0.0.0');
console.log('Server running at http://localhost:'+PORT+'/');