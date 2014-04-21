#!/usr/bin/env node
var cfgPath = require('confortable')('.flightbot.json', process.cwd());
if (!cfgPath) {
  throw new Error("When loading fligthbot externally, a local config is required");
}

require('./').on('data', function (o) {
  var found = o.aircraft + " at " + o.direction + " o'clock.";
  var where = " " + (o.flight || o.journey) + " is " + o.distance + 'm away';
  var alt = " at " + o.altitude + "ft";
  process.stdout.write(found + where + alt + '\n');
});
