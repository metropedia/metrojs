angular.module('metro')

.factory('MetroStation', ['metroHelper', function(helper) {

  function constructor(app, metro) {

    app.implement = function() {
      app.inputMode = metro.setInputMode('implement');
      var el = metro.getElements();
      el.pointer.
        classed('hide', true)
      ;
      el.shade.
        classed('hide', true)
      ;
      el.svg.
        classed('input-mode-select', false)
      ;
    };
    
    app.addStation = function() {
      var metroLine = metro.getCurrentMetroLine();
    
      if (metro.getPathString(metroLine) == '') {
        throw 'Empty Metro Line';
        return;
      } else {
        app.implement();
      }
    
      var layerStations = metroLine.layers.stations;
      var station = metro.newStation();
          station.id = metroLine.stations.length;
    
      helper.drawStation(layerStations, station, metro);
    
      metro.addStationObject(station);
      app.moveStation(metroLine, station);
    };
    
    app.moveStation = function(line, station) {
      station.position = parseFloat(station.position);
      var metroLine = metro.getMetroLineById(line.id);
      var layerStations = metroLine.layers.stations;
      var guide = metroLine.guide.node();
    
      var d = guide.getPointAtLength(station.position/100*guide.getTotalLength());
      layerStations.select('.svg-station[station-id="'+station.id+'"]')
        .attr('x', d.x)
        .attr('y', d.y)
      ;
    };

  }

  return constructor.prototype;
}]);
