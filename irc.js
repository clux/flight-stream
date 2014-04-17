#!/usr/bin/env node
var cfgPath = require('confortable')('.flightbot.json', process.cwd());
if (!cfgPath) {
  throw new Error("When loading fligthbot externally, a local config is required");
}
var cfg = require(cfgPath);

var ircStream = require('irc-stream')(cfg.server, cfg.name, {
  userName: 'flightbot',
  realName: '==o==(OO)==o==',
  debug: false,
  channels: [cfg.chan]
}, { conversationMode: true }); 

require('./planes').pipe(ircStream); // planes just expose a readable stream
