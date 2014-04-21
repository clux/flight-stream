# flight-stream
[![Dependency Status](https://david-dm.org/clux/flight-stream.png)](https://david-dm.org/clux/flight-stream)
[![unstable](http://hughsk.github.io/stability-badges/dist/unstable.svg)](http://nodejs.org/api/documentation.html#documentation_stability_index)

This is a readable stream in `objectMode` that will provide flight information near your area matching certain conditions. By default it looks for [A380s](http://en.wikipedia.org/wiki/Airbus_A380) near Heathrow airport.

## Usage
The library exposes only a readable stream that you may use however you like. The helper file irc.js uses it to pipe the information to an IRC channel via [irc-stream](http://npmjs.org/package/irc-stream).

Here is a simple way to just dump all matching planes spotted to console:

```js
var config = {
  location: {
    latitude: 51.5083818,
    longitude: -0.5596166
  },
  maxDistance: 5*1000
};
var PlaneStream = require('plane-stream');
new PlaneStream(config).on('data', function (plane) {
  console.log("%j", plane);
});
```

## Configuration
For the `config` object, the only thing you need to set is your location. But additionally you can set:

- `irc` if using the irc-stream example - then see the .flightstream.json file
- `aircraft` if want to filter by a single aircraft using [ICAO codes](http://en.wikipedia.org/wiki/ICAO_aircraft_type_designator)
- `maxDistance` the size of the bounding box to search for planes in meters
- `maxAltitude` of a plane in feet
- `clockShift` if you would not want to use relative north for direction output
- `throttleInterval` in seconds if you feel you get too many updates

## License
MIT-Licensed. See LICENSE file for details.
