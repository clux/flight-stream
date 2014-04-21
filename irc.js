#!/usr/bin/env node
var cfgPath = require('confortable')('.flightstream.json', process.cwd());
if (!cfgPath) {
  throw new Error("When loading fligthbot externally, a local config is required");
}
var cfg = require(cfgPath);
var PlaneStream = require('./');

var ircStream = require('irc-stream')(cfg.irc.server, cfg.irc.name, {
  userName: 'flightbot',
  realName: '==o==(OO)==o==',
  debug: false,
  channels: [cfg.irc.chan]
}, { conversationMode: true });

new PlaneStream(cfg).on('data', function (o) {
  var found = o.aircraft + " at " + o.direction + " o'clock.";
  var where = " " + (o.flight || o.journey) + " is " + o.distance + 'm away';
  var alt = " at " + o.altitude + "ft";
  ircStream.write({ message: found + where + alt, user: cfg.irc.chan });
});
