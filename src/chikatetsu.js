angular.module('chikatetsu', [])

.directive('chikatetsu', function() {
  return {
    scope: {
      topic: '='
    },
    templateUrl: '../src/chikatetsu.html',
    controller: 'chikatetsu',
    controllerAs: 'ctrl',
  };
})

.controller('chikatetsu', ['$scope', '$element', function($scope, $element){

  var ctrl = this;
      ctrl.topic = $scope.topic;
      ctrl.lines = [];
      ctrl.isDrawing = false;
      ctrl.currentLine = null;
      ctrl.shadePos = {x: undefined, y: undefined};
      ctrl.pathType = 'straight';
      ctrl.inputMode = 'draw';
      ctrl.currentEditJoint = null;
      ctrl.schemas = {
        line: {
          name: '',
          path: [],
          stops: []
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

  var drawLinePath = function(x1, y1, x2, y2, type, flipped, linePath) {
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
    if (linePath) {
      linePath
        .attr(isHead ? "d" : "_d", path.toString())
        .classed("rail", true)
    } else {
      var linePath = layerLinePaths
        .append("path")
        .attr(isHead ? "d" : "_d", path.toString())
        .classed("rail", true)
      ;
      var joint = layerJoints.selectAll()
        .data([{x: x2, y: y2 }])
        .enter()
        .append('circle')
          .attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; })
          .attr('r', r)
          .attr('class', 'joint')
        .on('mousedown', function() {
          if (ctrl.currentEditJoint) {
            d3.select(ctrl.currentEditJoint)
              .classed('current', false);
          }
          d3.select(this).classed('current', true);
          ctrl.currentEditJoint = this;
          console.log(d3.select(ctrl.currentEditJoint).datum().linePath.datum());
        })
        .call(
          d3.drag()
            .on('drag', evtJointDrag)
            .on('end', function() {
              d3.select(this).classed('hover', false);
            })
        )
      ;
      joint.datum({linePath: linePath})
    }

    linePath
      .datum({
        x1: x1, y1: y1, x2: x2, y2: y2, type: type, flipped: flipped
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
    if (ctrl.inputMode == 'edit') return;

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

    ctrl.currentLine.path.push({
       x1: x1,
       y1: y1,
       x2: x2,
       y2: y2,
       type: ctrl.pathType,
       flipped: false,
       linePath: linePath
    });

  };

  var svg = d3.select($element.find('div')[1]).append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('mousemove', evtCanvasMouseMove)
    .on('click', evtCanvasMouseClick)
  ;

  var layerGridlines = svg.append('g');
  var layerLinePaths = svg.append('g');
  var layerJoints = svg.append('g');
  var layerTop = svg.append('g');

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

  ctrl.newLine = function() {
    ctrl.currentLine = angular.copy(ctrl.schemas.line);
    ctrl.lines.push(ctrl.currentLine);
  };

  ctrl.editLine = function() {
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

  ctrl.useStraightLine = function() {
    ctrl.pathType = 'straight';
  };

  ctrl.useCurlyLine = function() {
    ctrl.pathType = 'curly';
  };

  ctrl.flipLast = function() {
    var linePathData = ctrl.currentLine.path[ctrl.currentLine.path.length - 1];
    linePathData.flipped = !linePathData.flipped;
    linePathData.linePath = drawLinePath(
      linePathData.x1, linePathData.y1,
      linePathData.x2, linePathData.y2,
      linePathData.type,
      linePathData.flipped,
      linePathData.linePath
    );
    ctrl.currentLine.path[ctrl.currentLine.path.length - 1] = linePathData;
  };

  ctrl.newLine();
}])



;
