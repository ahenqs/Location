// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

function generateRandomPoints(center, radius, count) {
  var points = [];
  for (var i=0; i<count; i++) {
    points.push(generateRandomPoint(center, radius));
  }
  return points;
}

function generateRandomPoint(center, radius) {
  var x0 = center.lon;
  var y0 = center.lat;
  // Convert Radius from meters to degrees.
  var rd = radius/111300;

  var u = Math.random();
  var v = Math.random();

  var w = rd * Math.sqrt(u);
  var t = 2 * Math.PI * v;
  var x = w * Math.cos(t);
  var y = w * Math.sin(t);

  var xp = x/Math.cos(y0);

  // Resulting point.
  return {'lat': y+y0, 'lon': xp+x0};
}

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-location';

// Port where we'll run the websocket server
var webSocketsServerPort = process.env.PORT || 8080;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// list of currently connected clients (users)
var clients = [ ];
var lat = 0.0;
var lon = 0.0;

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {

        if (message.type === 'utf8') { // only text

            var location;

            try {
              location = JSON.parse(message.utf8Data);
            } catch (e) {
              return console.error(e);
            }

            if (location['user'] != null) {

              console.log("\n\nUser\n\n");

              console.log("User is: " + location['user']);

            } else if (location['action'] == "update") {

                console.log("\n\nAction\n\n");

                var points = generateRandomPoints({'lat': lat, 'lon': lon}, 500, 20);

                console.log(new Date() + ' Updated locations')

                // broadcast message to all connected clients
                var json = JSON.stringify({ staus: "success",  results: points });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }

            } else {

                console.log("\n\nLocation\n\n");

                lat = parseFloat(location['location']['lat']);
                lon = parseFloat(location['location']['lon']);

                console.log("GOT THIS NOW: " + lat + " -> " + lon);

                var points = generateRandomPoints({'lat': lat, 'lon': lon}, 500, 20);

                console.log(new Date() + ' Updated locations')

                // broadcast message to all connected clients
                var json = JSON.stringify({ staus: "success",  results: points });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        } else {
          console.log("not utf8 bicth!");
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
        }
    });

});