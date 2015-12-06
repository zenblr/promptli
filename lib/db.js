var mongojs = require("mongojs");
var db = mongojs("localhost:27017/Tli", ["tests", "server_auth"]);
exports.mongojs = mongojs;
exports.db = db;

