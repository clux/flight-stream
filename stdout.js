#!/usr/bin/env node
var cfgPath = require('confortable')('.flightstream.json', process.cwd());
if (!cfgPath) {
  throw new Error("When loading fligthbot externally, a local config is required");
}
var cfg = require(cfgPath);
var FlightStream = require('./');

new FlightStream(cfg).on('data', function (o) {
  var found = o.time + ' - ' + o.aircraft + " at " + o.direction + " o'clock.";
  var where = " " + (o.flight || o.journey) + " is " + o.distance + 'm away';
  var alt = " at " + o.altitude + "ft";
  process.stdout.write(found + where + alt + '\n');
});
