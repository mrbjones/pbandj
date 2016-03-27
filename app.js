var http = require('http');
var url = require('url');
var express = require('express');
var fs = require("fs");
var path = require("path");
var mime = require("mime");

if (process.env.VCAP_SERVICES)
{
var services = JSON.parse(process.env.VCAP_SERVICES);

var orchestrateConfig = services["orchestrate"];
if (orchestrateConfig) {
var node = orchestrateConfig[0];
orchestrate_api_key = node.credentials.ORCHESTRATE_API_KEY
orchestrate_api_endpoint = node.credentials.ORCHESTRATE_API_HOST
}
};
var db = require("orchestrate")(orchestrate_api_key,orchestrate_api_endpoint);


function send404(response) {
response.writeHead(404, {"Content-type" : "text/plain"});
response.write("Error 404: resource not found");
response.end();
}
function sendPage(response, filePath, fileContents) {
response.writeHead(200, {"Content-type" : mime.lookup(path.basename(filePath))});
response.end(fileContents);
}
function serverWorking(response, absPath) {
fs.exists(absPath, function(exists) {
if (exists) {
fs.readFile(absPath, function(err, data) {
if (err) {
send404(response)
} else {
sendPage(response, absPath, data);
}
});
} else {
send404(response);
}
});
}
var server = http.createServer(function(request, response) {
  
  
  
  
  
  
  //this one sends the page!
if (queryData.o != "g" && queryData.o != "s") {
var filePath = false;
if (request.url == '/') {
filePath = "public/index.html";
} else {
filePath = "public" + request.url;
}
var absPath = "./" + filePath;
serverWorking(response, absPath); }
}).listen(process.env.VCAP_APP_PORT);

