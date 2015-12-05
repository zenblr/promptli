var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger("INDEX");
logger.setLevel("DEBUG");
var db = require('../lib/db').db;
var oneHour = 1 * 60 * 60 * 1000;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/:ask', function(req, res, next) {
  switch(req.params.ask) {
      case 'login':
        var version = req.body.version;
        res.setHeader('Content-Type', 'application/json');
        if ((req.session) && (req.session.TimeliAuth) && (req.session.TimeliAuth[version])) {
            res.send({access_token:req.session.TimeliAuth[version].access_token, message:''})
            res.end();
        }
        else {
            authenticateClient(version, function(repl) {
                if (repl.access_token) {
                    var auth = {};
                    if (req.session.TimeliAuth) {
                        auth = req.session.TimeliAuth;
                    }
                    auth[version] = {access_token:repl.access_token};
                    res.cookie('TimeliAuth', auth, {maxAge: oneHour, signed:true});
                }
                res.send(repl);
                res.end();
            });
        }
        break;
      case 'save':
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

var creds = {'v1':{
                    'domain':"volume.timeli.io",
                    'client':"e464c2f8-42f8-45e9-ade2-a152a3c93ea1",
                    'secret':"volume1secret",
                    'redirect_uri':"http://fiddle.jshell.net",
                    'scopes':"Administrator",
                    'grant_type': 'client_credentials',
                    'username':null,
                    'password':null
                  },
             'v2':{
                    'domain':"volume.timeli-staging.com",
                    'client':"e464c2f8-42f8-45e9-ade2-a152a3c93ea1",
                    'secret':"volume1secret",
                    'redirect_uri':"http://fiddle.jshell.net",
                    'scopes':"ADMINISTER",
                    'grant_type': 'password',
                    'username':'vijay',
                    'password':'vijaytimeli'
                  }
            };


function authenticateClient(version, cb) {
    var domain       = creds[version]['domain'],
        port         = 443,
        client       = creds[version]['client'],
        secret       = creds[version]['secret'],
        redirect_uri = creds[version]['redirect_uri'],
        scopes       = creds[version]['scopes'];
        grant_type   = creds[version]['grant_type'];
        username     = creds[version]['username'];
        password     = creds[version]['password'];

    var querystring = require('querystring'),
        https       = require('https');

    var access_data = {grant_type: grant_type,
                       client_id: client,
                       client_secret: secret,
                       scope: scopes,
                       redirect_uri: redirect_uri};
    if (username != null) {
        access_data['username'] = username;
    }
    if (password != null) {
        access_data['password'] = password;
    }
    var data = querystring.stringify(access_data);
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
