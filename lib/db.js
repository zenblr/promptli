var mongojs = require("mongojs");
var db = mongojs("localhost:27017/Tli", ["tests", "server_auth", "results"]);
exports.mongojs = mongojs;
exports.db = db;

