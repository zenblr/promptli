var domain       = "hari.timeli.io",
    port         = 443,
    client       = "f5195bd0-6b31-4212-8f82-9cc1ff7edc66",
    secret       = "Secret for Hari",
    redirect_uri = "http://fiddle.jshell.net",
    scopes       = "administrator";

var querystring = require('querystring'),
    https       = require('https');

var data = querystring.stringify({
                grant_type: "client_credentials",
                client_id: client,
                client_secret: secret,
                scope: scopes,
                redirect_uri: redirect_uri
          });
var options = {
        host: domain,
        port: port,
        path: "/rest/auth/token",
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data),
            'Accept': "application/json; charset=utf-8"
        }
    };

var repl = '';

var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                repl += chunk;
            });
            res.on('end', function () {
                console.log(repl);
            });
          });

req.write(data);
req.end();
