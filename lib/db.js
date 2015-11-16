var mongojs = require("mongojs");
var db = mongojs("localhost:27017/Tli", ["tests"]);
exports.mongojs = mongojs;
exports.db = db;

