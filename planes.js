planefinder = require('planefinder');
geolib = require('geolib');

// observe planes within 7km of location
var loc = {
  latitude: 51.4463184,
  longitude: -0.4443485
};
var maxDistance = 7*1000;  // meters
var bounds = geolib.getBoundsOfDistance(loc, maxDistance);

var ordinals = [
  'twelve', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten', 'eleven'
];
// 0 => above, 90, to the right, 180 underneath, 270 to the left
var bearingToClock = function (bear) {
  var units = 360/12; // degs per hour
  return Math.floor(bear/units) % 12;
};


var cfgPath = require('confortable')('.flightbot.json', process.cwd());
var cfg = require(cfgPath);

// ICAO code for A380 is A388
var isAppropriate = function (t) {
  return t.aircraft === 'A388' &&
         t.altitude > 0 &&
         t.altitude < 10000 &&
         t.callsign !== ''; // ensure no empty strings in streams obsrv hash
};

// if person faces the east => his 12 o'clock is east
var clockModifier = function (clock) {
  return Math.floor(clock + cfg.clockShift + 12) % 12;
};

var formater = function (t) {
  var dist = geolib.getDistance(loc, { latitude: t.lat, longitude: t.lon })
    , bear = geolib.getRhumbLineBearing(loc, { latitude: t.lat, longitude: t.lon })
    , dir = ordinals[clockModifier(bearingToClock(bear))]
    , desc = t.aircraft + " (" + t.journey + ")";
  if (t.journey && t.journey !== t.callsign) {
    desc += " is flight " + t.callsign;
  }
  console.log(desc + ' at ' + dir + " o'clock, " + dist + 'm away, @' + t.altitude + 'ft');
  return 'at ' + dir + " o'clock! (" + t.callsign + " is " + dist + 'm away)';
};

// create a readable stream to populate
var Readable = require('stream').Readable;
function PlaneStream(opts) {
  if (!(this instanceof PlaneStream)) {
    return new PlaneStream(opts);
  }
  this.chan = cfg.chan;
  this.obsrv = Object.create(null); // flight number to last observed hash
  Readable.call(this, { objectMode: true });
}
PlaneStream.prototype = Object.create(Readable.prototype);
PlaneStream.prototype._read = function () {}; // nothing to read by default
PlaneStream.prototype.identify = function (t) {
  var str = formater(t); // ensure we log regardless of spam protection
  if (!this.obsrv[t.callsign] || this.obsrv[t.callsign] < Date.now() + 5*1000) {
    this.obsrv[t.callsign] = Date.now(); // ensure only track once every 30s
    this.push({ message: str, user: cfg.chan });
  }
};
var stream = new PlaneStream();

var client = planefinder.createClient({ bounds: bounds });
client.on('data', function(traffic) {
  traffic.filter(isAppropriate).map(stream.identify.bind(stream));
}).resume();

module.exports = stream;
