var planefinder = require('planefinder')
  , geolib = require('geolib')
  , cfgPath = require('confortable')('.flightstream.json', process.cwd())
  , cfg = require(cfgPath);

// observe planes within specified distance
var loc = cfg.location;
var bounds = geolib.getBoundsOfDistance(loc, cfg.maxDistance);

var ordinals = [
  'twelve', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten', 'eleven'
];
// 0 => above, 90, to the right, 180 underneath, 270 to the left
var bearingToClock = function (bear) {
  var units = 360/12; // degs per hour
  return Math.floor(bear/units) % 12;
};

var isMatchingLowFlier = function (t) {
  if (cfg.aircraft && t.aircraft !== cfg.aircraft) {
    return false;
  }
  return t.altitude > 0 &&
         t.altitude < cfg.maxAltitude &&
         t.callsign !== ''; // ensure no empty strings in streams obsrv hash
};

// if person faces the east => his 12 o'clock is east
var clockModifier = function (clock) {
  return (clock + cfg.clockShift + 12) % 12;
};

var calculateProperties = function (t) {
  var bear = geolib.getRhumbLineBearing(loc, { latitude: t.lat, longitude: t.lon });
  var o = {
    distance: geolib.getDistance(loc, { latitude: t.lat, longitude: t.lon }),
    bearing: bear,
    direction: ordinals[clockModifier(bearingToClock(bear))],
    aircraft: t.aircraft,
    journey: t.journey,
    altitude: t.altitude
  };
  if (t.journey && t.journey !== t.callsign) {
    o.flight = t.callsign;
  }
  return o;
};

// create a readable stream to populate
var Readable = require('stream').Readable;
function PlaneStream() {
  this.obsrv = Object.create(null); // flight number to last observed hash
  Readable.call(this, { objectMode: true });
}
PlaneStream.prototype = Object.create(Readable.prototype);
PlaneStream.prototype._read = function () {}; // nothing to read by default
PlaneStream.prototype.identify = function (t) {
  var d = Date.now() + cfg.throttleInterval*1000;
  if (!this.obsrv[t.callsign] || this.obsrv[t.callsign] < d) {
    this.obsrv[t.callsign] = Date.now();
    this.push(calculateProperties(t));
  }
};
var stream = new PlaneStream();

var client = planefinder.createClient({ bounds: bounds });
client.on('data', function(traffic) {
  traffic.filter(isMatchingLowFlier).map(stream.identify.bind(stream));
}).resume();

module.exports = stream;
