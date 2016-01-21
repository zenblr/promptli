var mongojs = require("mongojs");
var mongohost = process.env.MONGO_HOST ?  process.env.MONGO_HOST : "localhost";
var db = mongojs(mongohost+":27017/Tli", ["tests", "server_auth", "results"]);
exports.mongojs = mongojs;
exports.db = db;

