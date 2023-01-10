# Threadfix_Heatmap_Visualization

Simple heatmap visualization of Threadfix security data inside a web page, using the apexcharts library.

## Development

Create a file called `config.js` with the following content:

```
exports.THREADFIX_APIKEY = '$THREADFIX_APIKEY'
exports.THREADFIX_BASEURL = '$THREADFIX_BASEURL'
```

Get the values of `$THREADFIX_APIKEY` and `$THREADFIX_BASEURL` from your running Threadfix installation.

Then start the node.js server and serve the index.html file:

```
# Start the node.js server on port 9876
$ npm install
$ node server.js &

# Serve the index.html on port 8000
python3 -m http.server  8000
```
