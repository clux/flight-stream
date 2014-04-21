var planefinder = require('planefinder')
  , geolib = require('geolib')
  , Readable = require('stream').Readable
  , ordinals = [
    'twelve', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine', 'ten', 'eleven'
  ];

// bearing: 0=north, 90=east, 180=south, 270=west
var bearingToClock = function (bear, modifier) {
  var units = 360/12; // degs per hour
  // zero modifier => compass clock (otherwise we rotate by modifier hours)
  return (Math.floor(bear/units) + modifier + 12) % 12;
};

var calculateProperties = function (t, loc, modifier) {
  var d = new Date();
  var bear = geolib.getRhumbLineBearing(loc, { latitude: t.lat, longitude: t.lon });
  var o = {
    distance: geolib.getDistance(loc, { latitude: t.lat, longitude: t.lon }),
    bearing: bear,
    direction: ordinals[bearingToClock(bear, modifier)],
    aircraft: t.aircraft,
    journey: t.journey,
    altitude: t.altitude,
    time: d.getHours() + ':' + d.getMinutes()
  };
  if (t.journey && t.journey !== t.callsign) {
    o.flight = t.callsign;
  }
  return o;
};

// create a readable stream to populate
function PlaneStream() {
  Readable.call(this, { objectMode: true });
}
PlaneStream.prototype = Object.create(Readable.prototype);
PlaneStream.prototype._read = function () {}; // nothing to read by default

module.exports = function (cfg) {
  // observe planes within specified distance
  var bounds = geolib.getBoundsOfDistance(cfg.location, cfg.maxDistance);

  var isMatchingLowFlier = function (t) {
    if (cfg.aircraft && t.aircraft !== cfg.aircraft) {
      return false;
    }
    return t.altitude > 0 &&
           t.altitude < cfg.maxAltitude &&
           t.callsign !== ''; // ensure no empty strings in streams obsrv hash
  };

  var stream = new PlaneStream();
  var obsrvd = Object.create(null); // flight number to last observed hash

  planefinder.createClient({ bounds: bounds }).on('data', function (traffic) {
    traffic.filter(isMatchingLowFlier).map(function (t) {
      var d = Date.now() + cfg.throttleInterval*1000; // basic throttling
      if (!obsrvd[t.callsign] || obsrvd[t.callsign] < d) {
        obsrvd[t.callsign] = Date.now();
        stream.push(calculateProperties(t, cfg.location, cfg.clockShift));
      }
    });
  }).resume();

  return stream;
};
