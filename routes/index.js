var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger("INDEX");
logger.setLevel("DEBUG");
var db = require('../lib/db').db;

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
      case 'save':
          console.log('>>> reached the code!');
          res.setHeader('Content-Type', 'application/json');
          var name = req.body.name;
          var content = req.body.content;
          db.tests.save({name:name, content:content});
          res.send({status:'success'});
          res.end();
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

router.get('/:ask', function(req, res, next) {
    switch(req.params.ask) {
        case 'get':
            res.setHeader('Content-Type', 'application/json');
            var name = req.query.name;
            console.log(">> "+name);
            db.tests.findOne({name:name}, function(err, test){
                if (!err && test) {
                    res.send({status:'success', content:test.content});
                    res.end();
                }
                else {
                    res.send({status:'failed', content:null});
                    res.end();
                }
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
    var //domain       = "volume.timeli-staging.com",
        domain       = "volume.timeli.io",
        port         = 443,
        //client       = "f5195bd0-6b31-4212-8f82-9cc1ff7edc66",
        client       = "e464c2f8-42f8-45e9-ade2-a152a3c93ea1",
        //secret       = "Secret for Mateo",
        secret       = "volume1secret",
        redirect_uri = "http://fiddle.jshell.net",
        scopes       = "Administrator";
        //scopes       = "administer";

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
