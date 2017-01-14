angular.module('metro', [])

.controller('metroDesigner', [
  '$scope', '$element', '$timeout', 'Metro',
  function($scope, $element, $timeout, Metro){
  var metro = new Metro();
  metro.setPointerR(10);
  
  var width = 960,
      height = 500,
      resolution = 20,
      round = function(p, n) {
        return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
      }
  ;

  var ctrl = this;
      ctrl.topic = $scope.topic;
      ctrl.metroLines = [];
      ctrl.isDrawing = false;
      ctrl.shadePos = {x: undefined, y: undefined};
      ctrl.pathType = 'straight';
      ctrl.inputMode = 'draw';
      ctrl.currentEditJoint = null;
      ctrl.schemas = {
        metroLine: {
          id: -1,
          name: '',
          color: '',
          layers: {

          },
          paths: [],
          stations: []
        },
        station: {
          id: -1,
          position: 0,
          name: '',
          color: ''
        }
      };

  var evtJointDrag = function(d) {
    var x2 = d3.event.x,
        y2 = d3.event.y;
    
    x2 = round(Math.max(r, Math.min(width - r, x2)), resolution);
    y2 = round(Math.max(r, Math.min(height - r, y2)), resolution);
  
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

  metro.on('jointDrag', evtJointDrag);


  var evtCanvasMouseMove = function() {
    var pos = d3.mouse(this);
    pointer
      .attr('cx', function(d) { return round(pos[0], resolution); })
      .attr('cy', function(d) { return round(pos[1], resolution); })
    ;
  };

  var evtCanvasMouseClick = function() {
    if (metro.getMetroLines().length === 0) return;
    if (ctrl.inputMode != 'draw') return;

    var pos = d3.mouse(this);
    var x2 = round(pos[0], resolution);
    var y2 = round(pos[1], resolution);

    var x1 = ctrl.shadePos.x;
    var y1 = ctrl.shadePos.y;

    var linePath = metro.drawLinePath(x1, y1, x2, y2, ctrl.pathType, false);

    shade
      .attr('cx', x2)
      .attr('cy', y2)
    ;
    ctrl.shadePos = {x: x2, y: y2};

  };

  var svg = d3.select($element.find('div')[1]).append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('mousemove', evtCanvasMouseMove)
  ;

  var layerGridlines = svg.append('g').attr('class', 'layer-group');
  var layerTop = svg.append('g').attr('class', 'layer-group');
  var layerSplash = svg.append('g').attr('class', 'splash');

  var evtSlpashClick = function() {
      $timeout(function() {
        svg.on('click', evtCanvasMouseClick);
      }, 0);
      ctrl.newMetroLine();
      $scope.$apply();
      layerSplash.remove();
  };

  layerSplash
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'black')
    .attr('opacity', .8)
  ;
  layerSplash
    .append('rect')
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('x', round(.5 * width, resolution))
    .attr('y', round(.5 * height, resolution))
    .attr('width', 150)
    .attr('height', 46)
    .attr('transform', 'translate(-75, -23)')
    .attr('stroke-width', 2)
    .attr('fill', 'white')
    .attr('cursor', 'pointer')
    .on('click', evtSlpashClick)
  ;
  layerSplash
    .append('text')
    .attr('x', round(.5 * width, resolution))
    .attr('y', round(.5 * height, resolution))
    .attr('width', 150)
    .attr('transform', 'translate(0, 7)')
    .attr('fill', 'black')
    .attr('cursor', 'pointer')
    .attr('font-size', '22px')
    .on('click', evtSlpashClick)
      .append('tspan')
      .attr('text-anchor', 'middle')
      .text('New Metro')
  ;

  layerGridlines.selectAll()
    .data(d3.range(1, width / resolution))
    .enter()
    .append('line')
      .attr('class', 'vertical')
      .attr('x1', function(d) { return d * resolution; })
      .attr('y1', 0)
      .attr('x2', function(d) { return d * resolution; })
      .attr('y2', height);
  
  layerGridlines.selectAll()
    .data(d3.range(1, height / resolution))
    .enter()
    .append('line')
      .attr('class', 'horizontal')
      .attr('x1', 0)
      .attr('y1', function(d) { return d * resolution; })
      .attr('x2', width)
      .attr('y2', function(d) { return d * resolution; });

  var pointer = layerTop.selectAll()
    .data([{
      x: round(.5 * width, resolution),
      y: round(.5 * height, resolution)
    }])
    .enter()
    .append('circle')
      .attr('class', 'pointer')
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', metro.getPointerR());

  var shade = layerTop.selectAll()
    .data([{x: -999, y: -999 }])
    .enter()
    .append('circle')
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', metro.getPointerR());

  ctrl.newMetroLine = function() {
    var layerMetroLine = svg.append('g').attr('class', 'layer-group');
    var layerLinePaths = layerMetroLine.append('g');
    var layerJoints = layerMetroLine.append('g');
    var layerStations = layerMetroLine.append('g');
    svg.node().appendChild(layerTop.node());

    ctrl.shadePos = {x: undefined, y: undefined};

    var currentMetroLine = angular.copy(ctrl.schemas.metroLine);
        currentMetroLine.id = ctrl.metroLines.length;
        currentMetroLine.layers.metroLine = layerMetroLine;
        currentMetroLine.layers.linePaths = layerLinePaths;
        currentMetroLine.layers.joints = layerJoints;
        currentMetroLine.layers.stations = layerStations;

    metro.setCurrentMetroLine(currentMetroLine);

    metro.addMetroLine(currentMetroLine);

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
    var currentMetroLine = metro.getCurrentMetroLine();
    var layerMetroLine = currentMetroLine.layers.metroLine;
    var layerLinePaths = currentMetroLine.layers.linePaths;
    var layerJoints = currentMetroLine.layers.joints;

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
    var linePathJoint = ctrl.currentEditJoint;
    metro.drawLinePath(
      linePathJoint.data.x1, linePathJoint.data.y1,
      linePathJoint.data.x2, linePathJoint.data.y2,
      linePathJoint.data.type,
      linePathJoint.data.flipped,
      linePathJoint.linePath
    );
  };

  ctrl.splitLinePath = function() {
    var linePathJoint = ctrl.currentEditJoint;
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
    var station = angular.copy(ctrl.schemas.station);
        station.id = metroLine.stations.length;
    
    layerStations.append('rect')
      .attr('station-id', station.id)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', round(.5 * width, resolution))
      .attr('y', round(.5 * height, resolution))
      .attr('width', 22)
      .attr('height', 22)
      .attr('transform', 'translate(-11, -11)')
      .attr('stroke-width', 2)
      .classed('svg-station', true)
    ;

    metro.addStationObject(station);
    ctrl.moveStation(metroLine, station);
  };

  ctrl.moveStation = function(line, station) {
    var metroLine = metro.getMetroLineById(line.id);
    var pathString = metro.getPathString(metroLine);
    var layerStations = metroLine.layers.stations;

    var guide = layerStations.append('path')
      .attr('class', 'guide')
      .attr('d', pathString)
      .attr('stroke-width', 2)
      .attr('stroke', 'red')
      .attr('fill', 'none')
      .attr('display', 'none')
      .node()
    ;

    var d = guide.getPointAtLength(station.position/100*guide.getTotalLength());

    layerStations.select('.svg-station[station-id="'+station.id+'"]')
      .attr('x', d.x)
      .attr('y', d.y)
    ;
  };
}])



;
