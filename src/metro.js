angular.module('metro', [])

.directive('metro', function() {
  return {
    scope: {
      topic: '='
    },
    templateUrl: '../src/metro.html',
    controller: 'metro',
    controllerAs: 'ctrl',
  };
})

.controller('metro', ['$scope', '$element', function($scope, $element){

  var ctrl = this;
      ctrl.topic = $scope.topic;
      ctrl.metroLines = [];
      ctrl.isDrawing = false;
      ctrl.currentMetroLine = null;
      ctrl.shadePos = {x: undefined, y: undefined};
      ctrl.pathType = 'straight';
      ctrl.inputMode = 'draw';
      ctrl.currentEditJoint = null;
      ctrl.currentStation = null;
      ctrl.stationPosition = 0;
      ctrl.schemas = {
        metroLine: {
          name: '',
          layers: {

          },
          paths: [],
          stations: []
        }
      };

  var width = 960,
      height = 500,
      resolution = 20,
      r = 10;

  var round = function(p, n) {
    return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
  };

  var evtJointDrag = function(d) {
    var x2 = d3.event.x,
        y2 = d3.event.y;
    
    x2 = round(Math.max(r, Math.min(width - r, x2)), resolution),
    y2 = round(Math.max(r, Math.min(height - r, y2)), resolution);
  
    var joint = d3.select(this)
      .attr('cx', x2)
      .attr('cy', y2)
      .classed('hover', true)
    ;

    var jointData = joint.datum();
    var linePath = jointData.linePath;
    var linePathData = linePath.datum();
    drawLinePath(
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
      drawLinePath(
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

  var drawLinePath = function(x1, y1, x2, y2, type, flipped, linePath, insertBefore) {
    var layerMetroLine = ctrl.currentMetroLine.layers.metroLine;
    var layerLinePaths = ctrl.currentMetroLine.layers.linePaths;
    var layerJoints = ctrl.currentMetroLine.layers.joints;

    var isHead = typeof x1 != 'undefined' && typeof x2 != 'undefined';
    var path = d3.path();
    path.moveTo(x1, y1);
    if (type == 'straight') {
      path.lineTo(x2, y2);
    } else if (type == 'curly') {
      if (flipped) {
        path.quadraticCurveTo(x1, y2, x2, y2);
      } else {
        path.quadraticCurveTo(x2, y1, x2, y2);
      }
    }
    var pathString = path.toString();
    if (linePath) {
      linePath
        .attr(isHead ? 'd' : '_d', pathString)
        .classed('rail', true)
    } else {
      var linePath;
      var beforeIndex;
      if (insertBefore) {
        beforeIndex = layerLinePaths
          .selectAll('.rail').data()
          .indexOf(insertBefore.data()[0]) + 1
        ;
        linePath = layerLinePaths.insert('path', ':nth-child(' + beforeIndex + ')');
      } else {
        linePath = layerLinePaths.append('path');
      }
      linePath
        .attr(isHead ? 'd' : '_d', pathString)
        .classed('rail', true)
      ;

      var joint = layerJoints.selectAll()
          .data([{x: x2, y: y2 }])
          .enter()
      ;
      if (insertBefore && beforeIndex) {
        joint = joint.insert('circle', ':nth-child(' + beforeIndex + ')');
      } else {
        joint = joint.append('circle');
      }
      joint
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', r)
        .attr('class', 'joint')
        .on('mousedown', function() {
          if (ctrl.currentEditJoint) {
            d3.select(ctrl.currentEditJoint.joint)
              .classed('current', false);
          }
          d3.select(this).classed('current', true);
          ctrl.currentEditJoint = {
            linePath: linePath,
            joint: this,
            data: d3.select(this).datum().linePath.datum()
          }; this;
          $scope.$apply();
          console.log(ctrl.currentEditJoint.data)
        })
        .call(
          d3.drag()
            .on('drag', evtJointDrag)
            .on('end', function() {
              d3.select(this).classed('hover', false);
              ctrl.currentEditJoint.data = d3.select(this).datum().linePath.datum();
              $scope.$apply();
            })
        )
      ;
      joint.datum({linePath: linePath})
    }

    linePath
      .datum({
        x1: x1, y1: y1, x2: x2, y2: y2, type: type, flipped: flipped, pathString: pathString
      })
    ;

    return linePath;
  };

  var evtCanvasMouseMove = function() {
    var pos = d3.mouse(this);
    pointer
      .attr('cx', function(d) { return round(pos[0], resolution); })
      .attr('cy', function(d) { return round(pos[1], resolution); })
    ;
  };

  var evtCanvasMouseClick = function() {
    if (ctrl.inputMode != 'draw') return;

    var pos = d3.mouse(this);
    var x2 = round(pos[0], resolution);
    var y2 = round(pos[1], resolution);

    var x1 = ctrl.shadePos.x;
    var y1 = ctrl.shadePos.y;

    var linePath = drawLinePath(x1, y1, x2, y2, ctrl.pathType, false);

    shade
      .attr('cx', x2)
      .attr('cy', y2)
    ;
    ctrl.shadePos = {x: x2, y: y2};

    console.log(ctrl.currentMetroLine)
  };

  var svg = d3.select($element.find('div')[1]).append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('mousemove', evtCanvasMouseMove)
    .on('click', evtCanvasMouseClick)
  ;

  var layerGridlines = svg.append('g').attr('class', 'layer-group');
  var layerTop = svg.append('g').attr('class', 'layer-group');

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
      .attr('r', r);

  var shade = layerTop.selectAll()
    .data([{x: -999, y: -999 }])
    .enter()
    .append('circle')
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', r);

  ctrl.newMetroLine = function() {
    var layerMetroLine = svg.append('g').attr('class', 'layer-group');
    var layerLinePaths = layerMetroLine.append('g');
    var layerJoints = layerMetroLine.append('g');
    var layerStations = layerMetroLine.append('g');
    svg.node().appendChild(layerTop.node());

    ctrl.shadePos = {x: undefined, y: undefined};

    ctrl.currentMetroLine = angular.copy(ctrl.schemas.metroLine);
    ctrl.currentMetroLine.layers.metroLine = layerMetroLine;
    ctrl.currentMetroLine.layers.linePaths = layerLinePaths;
    ctrl.currentMetroLine.layers.joints = layerJoints;
    ctrl.currentMetroLine.layers.stations = layerStations;

    ctrl.metroLines.push(ctrl.currentMetroLine);
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
    var layerMetroLine = ctrl.currentMetroLine.layers.metroLine;
    var layerLinePaths = ctrl.currentMetroLine.layers.linePaths;
    var layerJoints = ctrl.currentMetroLine.layers.joints;

    var jointData = layerJoints.select('.joint:last-child').datum();
    var linePath = jointData.linePath;
    var linePathData = linePath.datum();
    linePathData.flipped = !linePathData.flipped;
    linePathData.linePath = drawLinePath(
      linePathData.x1, linePathData.y1,
      linePathData.x2, linePathData.y2,
      linePathData.type,
      linePathData.flipped,
      linePath
    );
  };

  ctrl.applyLinePathChange = function() {
    var linePathJoint = ctrl.currentEditJoint;
    drawLinePath(
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

    drawLinePath(
      left.x1, left.y1,
      left.x2, left.y2,
      left.type, left.flipped,
      null,
      linePathJoint.linePath
    );
    drawLinePath(
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
    var layerStations = ctrl.currentMetroLine.layers.stations;
    
    ctrl.currentStation = layerStations.append('rect')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', round(.5 * width, resolution))
      .attr('y', round(.5 * height, resolution))
      .attr('width', 22)
      .attr('height', 22)
      .attr('transform', 'translate(-11, -11)')
      .attr('stroke-width', 2)
      .classed('svg-station', true)
      .on('mousedown', function() {
        ctrl.currentStation = d3.select(this);
      })
    ;

    ctrl.stationPosition = 0;
    ctrl.moveStation();
  };

  ctrl.moveStation = function() {
    var railData = ctrl.currentMetroLine.layers.linePaths.selectAll('.rail').data();
    railData.shift();
    var pathString = railData.map(function(p){return p.pathString}).join(',');

    var layerStations = ctrl.currentMetroLine.layers.stations;
    var movingTrack = layerStations
      .append('path')
      .attr('d', pathString)
      .attr('stroke-width', 2)
      .attr('stroke', 'red')
      .attr('fill', 'none')
      .attr('display', 'none')
    ;

    var trackNode = movingTrack.node();
    var totalLength = trackNode.getTotalLength();

    var d = trackNode.getPointAtLength(ctrl.stationPosition/100*totalLength);

    ctrl.currentStation
      .attr('x', d.x)
      .attr('y', d.y)
    ;
  };

  ctrl.newMetroLine();
}])



;
