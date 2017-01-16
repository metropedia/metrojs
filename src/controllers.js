angular.module('metro', [])

.controller('metroDesigner', [
  '$scope', '$element', 'Metro', 'metroHelper',
  function($scope, $element, Metro, helper){

  var def = {
    pointerRadius: 10,
    width: 960,
    height: 500,
    resolution: 20,
    container: $element.find('div')[1],
    inputMode: 'draw',
    pathType: 'straight'
  };

  var metro = new Metro(def);

  var ctrl = this;
      ctrl.topic = $scope.topic;
      ctrl.metroLines = [];
      ctrl.currentEditJoint = null;
      ctrl.inputMode = metro.getInputMode();

  metro.on('jointDrag', function(shadePos) {
    //console.log(shadePos)
  });

  metro.on('jointMouseDown', function(jointData) {
    ctrl.currentEditJoint = jointData;
    $scope.$apply();
  });

  metro.on('splashButtonClick', function() {
    ctrl.newMetroLine();
    $scope.$apply();
  });

  metro.on('canvasMouseClick', function(shadePos) {
    //console.log(shadePos)
  });
  

  ctrl.newMetroLine = function() {
    var metroLine = metro.addMetroLine();
    metro.setCurrentMetroLine(metroLine);
    ctrl.metroLines = metro.getMetroLines();
  };

  ctrl.editMetroLine = function() {
    ctrl.inputMode = metro.setInputMode('edit');
    var el = metro.getElements();
    el.pointer.
      classed('hide', true)
    ;
    el.shade.
      classed('hide', true)
    ;
    el.svg.
      classed('input-mode-select', true)
    ;
  };

  ctrl.draw = function() {
    ctrl.inputMode = metro.setInputMode('draw');
    var el = metro.getElements();
    el.pointer.
      classed('hide', false)
    ;
    el.shade.
      classed('hide', false)
    ;
    el.svg.
      classed('input-mode-select', false)
    ;
  };

  ctrl.implement = function() {
    ctrl.inputMode = metro.setInputMode('implement');
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

  ctrl.useStraightPath = function() {
    ctrl.pathType = metro.setPathType('straight');
  };

  ctrl.useCurlyPath = function() {
    ctrl.pathType = metro.setPathType('curly');
  };

  ctrl.flipLast = function() {
    var metroLine = metro.getCurrentMetroLine();
    var layerMetroLine = metroLine.layers.metroLine;
    var layerLinePaths = metroLine.layers.linePaths;
    var layerJoints = metroLine.layers.joints;

    var jointData = layerJoints.select('.joint:last-child').datum();
    var linePath = jointData.linePath;
    var linePathData = linePath.datum();
    linePathData.flipped = !linePathData.flipped;
    linePathData.linePath = metro.drawLinePath(
      linePathData.x1, linePathData.y1,
      linePathData.x2, linePathData.y2,
      linePathData.type,
      linePathData.flipped,
      linePath
    );
  };

  ctrl.applyLinePathChange = function() {
    var linePathJoint = metro.getCurrentEditJoint();
    metro.drawLinePath(
      linePathJoint.data.x1, linePathJoint.data.y1,
      linePathJoint.data.x2, linePathJoint.data.y2,
      linePathJoint.data.type,
      linePathJoint.data.flipped,
      linePathJoint.linePath
    );
  };

  ctrl.splitLinePath = function() {
    var linePathJoint = metro.getCurrentEditJoint();
    var d = linePathJoint.data;
    var dx = (d.x2 - d.x1)/2;
    var dy = (d.y2 - d.y1)/2;
    var left = {
      x1: d.x1, y1: d.y1,
      x2: d.x1 + dx, y2: d.y1 + dy,
      type: d.type,
      flipped: d.flipped
    };
    var right = {
      x1: d.x2 - dx, y1: d.y2 - dy,
      x2: d.x2, y2: d.y2,
      type: d.type,
      flipped: d.flipped
    };

    metro.drawLinePath(
      left.x1, left.y1,
      left.x2, left.y2,
      left.type, left.flipped,
      null,
      linePathJoint.linePath
    );
    metro.drawLinePath(
      right.x1, right.y1,
      right.x2, right.y2,
      right.type, right.flipped,
      null,
      linePathJoint.linePath
    );
    linePathJoint.joint.remove();
    linePathJoint.linePath.remove();
  };

  ctrl.addStation = function() {
    var metroLine = metro.getCurrentMetroLine();

    if (metro.getPathString(metroLine) == '') {
      throw 'Empty Metro Line';
      return;
    } else {
      ctrl.implement();
    }

    var layerStations = metroLine.layers.stations;
    var station = metro.newStation();
        station.id = metroLine.stations.length;
    
    helper.drawStation(layerStations, station, def);

    metro.addStationObject(station);
    ctrl.moveStation(metroLine, station);
  };

  ctrl.moveStation = function(line, station) {
    station.position = parseFloat(station.position);
    var metroLine = metro.getMetroLineById(line.id);
    var pathString = metro.getPathString(metroLine);
    var layerStations = metroLine.layers.stations;
    var guide = layerStations.select('.guide');
    if (guide.size() === 0) {
      guide = layerStations.append('path').attr('class', 'guide');
    }

    guide = helper.drawGuide(guide, pathString).node();

    var d = guide.getPointAtLength(station.position/100*guide.getTotalLength());
    layerStations.select('.svg-station[station-id="'+station.id+'"]')
      .attr('x', d.x)
      .attr('y', d.y)
    ;
  };
}])



;
