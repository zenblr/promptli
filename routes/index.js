var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger("INDEX");
logger.setLevel("DEBUG");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/:ask', function(req, res, next) {
  switch(req.params.ask) {
      case 'login':
        res.setHeader('Content-Type', 'application/json');
        authenticateClient(function(repl) {
            res.send(repl);
            res.end();
        });
        break;
      default:
        if (next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        }
        break;
  }
});

module.exports = router;

// Private methods below this point

function authenticateClient(cb) {
    var domain       = "mateo.timeli.io",
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
                    cb(repl);
                });
                res.on('error', function (e) {
                    logger.error(e);
                    cb(e);
                });
              });

    req.write(data);
    req.end();
}
