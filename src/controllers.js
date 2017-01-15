angular.module('metro', [])

.controller('metroDesigner', [
  '$scope', '$element', '$timeout', 'Metro', 'metroHelper',
  function($scope, $element, $timeout, Metro, helper){

  var def = {
    pointerRadius: 10,
    width: 960,
    height: 500,
    resolution: 20,
  };

  var metro = new Metro(def, $scope);

  var ctrl = this;
      ctrl.topic = $scope.topic;
      ctrl.metroLines = [];
      ctrl.shadePos = {x: undefined, y: undefined};
      ctrl.pathType = 'straight';
      ctrl.inputMode = 'draw';
      ctrl.currentEditJoint = null;

  var evtJointDrag = function(d) {
    var r = def.pointerRadius;
    var x2 = d3.event.x,
        y2 = d3.event.y;
    
    x2 = helper.round(Math.max(r, Math.min(def.width - r, x2)), def.resolution);
    y2 = helper.round(Math.max(r, Math.min(def.height - r, y2)), def.resolution);
  
    var joint = d3.select(this)
      .attr('cx', x2)
      .attr('cy', y2)
      .classed('hover', true)
    ;

    var jointData = joint.datum();
    var linePath = jointData.linePath;
    var linePathData = linePath.datum();

    metro.drawLinePath(
      linePathData.x1, linePathData.y1,
      x2, y2,
      linePathData.type,
      linePathData.flipped,
      linePath
    );

    if (d3.select(this.nextElementSibling).size() > 0) {
      var nextSibling = d3.select(this.nextElementSibling);
      var nextSiblingData = nextSibling.datum();
      var nextSiblingLinePath = nextSiblingData.linePath;
      var nextSiblingLinePathData = nextSiblingLinePath.datum();
      metro.drawLinePath(
        x2, y2,
        nextSiblingLinePathData.x2, nextSiblingLinePathData.y2,
        nextSiblingLinePathData.type,
        nextSiblingLinePathData.flipped,
        nextSiblingLinePath
      );
    } else {
      shade
        .attr('cx', x2)
        .attr('cy', y2)
      ;
      ctrl.shadePos = {x: x2, y: y2};
    }
  };


  var evtCanvasMouseMove = function() {
    var pos = d3.mouse(this);
    pointer
      .attr('cx', function(d) { return helper.round(pos[0], def.resolution); })
      .attr('cy', function(d) { return helper.round(pos[1], def.resolution); })
    ;
  };

  var evtCanvasMouseClick = function() {
    if (metro.getMetroLines().length === 0) return;
    if (ctrl.inputMode != 'draw') return;

    var pos = d3.mouse(this);
    var x2 = helper.round(pos[0], def.resolution);
    var y2 = helper.round(pos[1], def.resolution);

    var x1 = ctrl.shadePos.x;
    var y1 = ctrl.shadePos.y;

    var linePath = metro.drawLinePath(x1, y1, x2, y2, ctrl.pathType, false);

    shade
      .attr('cx', x2)
      .attr('cy', y2)
    ;
    ctrl.shadePos = {x: x2, y: y2};

  };

  var evtSlpashClick = function() {
      $timeout(function() {
        svg.on('click', evtCanvasMouseClick);
      }, 0);
      ctrl.newMetroLine();
      $scope.$apply();
      layerSplash.remove();
  };

  //move to service
  var svg = helper
        .drawCanvas(d3.select($element.find('div')[1]), def)
        .on('mousemove', evtCanvasMouseMove);

  var layerGridlines = svg.append('g').attr('class', 'layer-group');
  var layerTop = svg.append('g').attr('class', 'layer-group');
  var layerSplash = svg.append('g').attr('class', 'splash');

  var splash = helper.drawSplashMask(layerSplash, def);
  var splashButton = helper.drawSplashButton(layerSplash, def).on('click', evtSlpashClick);
  var splashButtonText = helper.drawSplashButtonText(layerSplash, def).on('click', evtSlpashClick);
  var gridlines = helper.drawGridlines(layerGridlines, def);
  var pointer = helper.drawPointer(layerTop, def);
  var shade = helper.drawShade(layerTop, def);

  metro.on('jointDrag', evtJointDrag);

  metro.on('jointMouseDown', function(jointData) {
    ctrl.currentEditJoint = jointData;
    $scope.$apply();
  });

  ctrl.newMetroLine = function() {
    var layerMetroLine = svg.append('g').attr('class', 'layer-group');
    var layerLinePaths = layerMetroLine.append('g');
    var layerJoints = layerMetroLine.append('g');
    var layerStations = layerMetroLine.append('g');
    svg.node().appendChild(layerTop.node());

    ctrl.shadePos = {x: undefined, y: undefined};

    var metroLine = metro.newMetroLine();
        metroLine.id = ctrl.metroLines.length;
        metroLine.layers.metroLine = layerMetroLine;
        metroLine.layers.linePaths = layerLinePaths;
        metroLine.layers.joints = layerJoints;
        metroLine.layers.stations = layerStations;

    metro.setCurrentMetroLine(metroLine);
    metro.addMetroLine(metroLine);

    ctrl.metroLines = metro.getMetroLines();
  };

  ctrl.editMetroLine = function() {
    ctrl.inputMode = 'edit';
    pointer.
      classed('hide', true)
    ;
    shade.
      classed('hide', true)
    ;
    svg.
      classed('input-mode-select', true)
    ;
  };

  ctrl.draw = function() {
    ctrl.inputMode = 'draw';
    pointer.
      classed('hide', false)
    ;
    shade.
      classed('hide', false)
    ;
    svg.
      classed('input-mode-select', false)
    ;
  };

  ctrl.implement = function() {
    ctrl.inputMode = 'implement';
    pointer.
      classed('hide', true)
    ;
    shade.
      classed('hide', true)
    ;
    svg.
      classed('input-mode-select', false)
    ;
  };

  ctrl.useStraightPath = function() {
    ctrl.pathType = 'straight';
  };

  ctrl.useCurlyPath = function() {
    ctrl.pathType = 'curly';
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
