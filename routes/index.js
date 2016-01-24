var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger("INDEX");
logger.setLevel("DEBUG");
var db = require('../lib/db').db;
var eventemitter = require('events');
var testcomplete = new eventemitter();
var config = require('../config/config');
var oneHour = 1 * 60 * 60 * 1000;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', testconfig:config.tests });
});

router.post('/:ask', function(req, res, next) {
  switch(req.params.ask) {
      case 'login':
            var version = req.body.version;
            res.setHeader('Content-Type', 'application/json');
            db.server_auth.findOne({version:version}, function(err, data){
                if ((!err && data) && (is_valid_token(data))){
                    res.send(data);
                    res.end();
                }
                else {
                    remove_token(version);
                    authenticateClient(version, function(repl) {
                        var data = {};
                        if (repl != null) {
                            data = JSON.parse(repl);
                        }
                        if (data.access_token) {
                            data.version=version;
                            data.date = Date.now();
                            db.server_auth.save(data);
                        }
                        res.send(repl);
                        res.end();
                    });
                }
            });
            break;
      case 'refresh_token':
            var version = req.body.version;
            res.setHeader('Content-Type', 'application/json');
            if (typeof(version) == "undefined") {
                res.send({"status": "fail", "message": "no version specified"});
                res.end();
            }
            else if(!(version in creds)) {
                res.send({"status": "fail", "message": "unknown version specified"});
                res.end();
            }
            else {
                remove_token(version, function(ret) {
                    res.send(ret);
                    res.end();
                });
            }
            break;
      case 'save':
            res.setHeader('Content-Type', 'application/json');
            var name = req.body.name;
            var content = req.body.content;
            var desc = req.body.description;
            var type = req.body.content_type;

            if (type && (type == "array")) {
                content = JSON.parse(content);
            }
            //db.tests.save({name:name, desc:desc,content:content});
            db.tests.update({name:name}, {name:name,desc:desc,content:content}, {upsert:true});
            res.send({status:'success'});
            res.end();
            break;
      case 'delete':
          res.setHeader('Content-Type', 'application/json');
          var names = req.body.names;
          if (names) {
              names = JSON.parse(names);
          }
          if (names && (Array.isArray(names))) {
              db.tests.remove({name:{$in:names}}, function(err, doc) {
                if (!err) {
                    res.send({status:'success'});
                    res.end();
                }
                else {
                    res.send({status:'failed', message:err});
                    res.end();
                }
              });
          }
          else {
              res.send({status:'failed', message:'no inputs provided'});
              res.end();
          }
          break;
      case 'rename':
          res.setHeader('Content-Type', 'application/json');
          var original = req.body.original;
          var changed = req.body.changed;
          if (original && changed) {
              db.tests.findAndModify({
                  query : {name: original},
                  update: {$set: {name: changed}},
                  new: false
              }, function (err, doc) {
                  if (!err) {
                      res.send({status:'success'});
                      res.end();
                  }
                  else {
                      res.send({status:'failed', message:err});
                      res.end();
                  }
              })
          }
          else {
              res.send({status:'failed', message:'no inputs provided'});
              res.end();
          }
          break;
      case 'save_results':
          res.setHeader('Content-Type', 'application/json');
          var name = req.body.name;
          var log = req.body.log;
          db.results.update({name:name}, {name:name,log:log}, {upsert:true}, function() {
              testcomplete.emit(name, log);
              console.log(">> Event "+name+"  sent...");
              res.send({status:'success'});
              res.end();
          });
          break;
      case 'update_config':
          res.setHeader('Content-Type', 'application/json');
          for (var n in req.body) {
              if (req.body.hasOwnProperty(n)) {
                  config.tests[n] = req.body[n];
              };
          }
          res.send({status:'success', testconfig:config.tests});
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
                    var content_type = Array.isArray(test.content) ? "array" : "string";
                    res.send({status:'success', content:test.content, content_type:content_type});
                    res.end();
                }
                else {
                    res.send({status:'failed', content:null});
                    res.end();
                }
            });
            break;
        case 'get_all':
            res.setHeader('Content-Type', 'application/json');
            var name = req.query.name;
            var scripts = [];
            db.tests.find().forEach(function(err, script) {
                if (!err) {
                    if (script) {
                        scripts.push({name: script.name, description:script.desc});
                    }
                    else {
                        res.send({status: 'success', scripts:scripts});
                        res.end();
                    }
                } else {
                    res.send({status:'failed', message:"failed to get scripts"});
                    res.end();
                }
            });
            break;
        case 'run_auto':
            var name = req.query.name;
            name = name ? name : "default";
            var quiet = req.query.q;
            if (quiet && (quiet == 'y')) {
                run_auto_quiet(name);
                testcomplete.once(name, function(r) {
                    console.log(">> Event "+name+"  received...");
                    //res.setHeader('Content-Type', 'application/json');
                    res.send(r);
                    res.end();
                });
                return;
            }
            res.render('index', { title: 'Express', run_auto:name, testconfig:config.tests });
            break;
        case 'get_results':
            res.setHeader('Content-Type', 'application/json');
            var name = req.query.name;
            db.results.findOne({name:name}, function(err, result){
                if (!err && result) {
                    res.send({status:'success', result:result.log});
                    res.end();
                }
                else {
                    res.send({status:'failed', result:null});
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
                    'domain':"volume.timeli.io",
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
                'Accept': "application/json; charset=utf-8",
                "X-Timeli-Version": (version == "v2" ? "2.0" : "1.0")
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

function remove_token(version, cb) {
    db.server_auth.remove({version:version}, function(err, data) {
        if (cb && (typeof(cb) == "function")) {
            if (!err) {
                cb({"status": "success"});
            }
            else {
                cb({"status": "fail"});
            }
        }
    });
}

function is_valid_token(data) {
    var now = Date.now();
    var then = data.date;
    var expires_in = data.expires_in;
    if (((now-then)/1000) > expires_in) {
        return false;
    }
    return true;
}


function run_auto_quiet(name) {
    var exec = require('child_process').exec;
    var display = '';
    if (config.env == "production") {
        display = 'export DISPLAY=:10;  ';
    }
    var cmd = display+'firefox http://localhost:3000/run_auto?name='+name;
    exec(cmd, function(error, stdout, stderr) {
    });
}
