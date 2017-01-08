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
      ctrl.shadePos = {x: null, y: null};
      ctrl.pathType = 'straight';
      ctrl.inputMode = 'draw';
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

  var canvasMouseMove = function() {
    var pos = d3.mouse(this);
    pointer
      .attr('cx', function(d) { return round(pos[0], resolution); })
      .attr('cy', function(d) { return round(pos[1], resolution); })
    ;
  };

  var drawlinePath = function(x1, y1, x2, y2, type, flipped) {
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

    var linePath = svg
      .append("path")
      .attr("d", path.toString())
      .classed("rail", true)
    ;

    return linePath;
  };

  var canvasMouseClick = function() {
    if (ctrl.inputMode == 'select') return;

    var pos = d3.mouse(this);
    var x2 = round(pos[0], resolution);
    var y2 = round(pos[1], resolution);

    var x1 = ctrl.shadePos.x || x2;
    var y1 = ctrl.shadePos.y || y2;

    var linePath = drawlinePath(x1, y1, x2, y2, ctrl.pathType, false);

    var joint = svg.selectAll()
      .data([{x: x2, y: y2 }])
      .enter()
      .append('circle')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', r)
        .attr('class', 'joint')
      .on('mouseover', function() {
        console.log(123);
      })
    ;

    shade
      .attr('cx', function(d) { return x2; })
      .attr('cy', function(d) { return y2; })
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
    .on('mousemove', canvasMouseMove)
    .on('click', canvasMouseClick)
  ;

  svg.selectAll()
    .data(d3.range(1, width / resolution))
    .enter()
    .append('line')
      .attr('class', 'vertical')
      .attr('x1', function(d) { return d * resolution; })
      .attr('y1', 0)
      .attr('x2', function(d) { return d * resolution; })
      .attr('y2', height);
  
  svg.selectAll()
    .data(d3.range(1, height / resolution))
    .enter()
    .append('line')
      .attr('class', 'horizontal')
      .attr('x1', 0)
      .attr('y1', function(d) { return d * resolution; })
      .attr('x2', width)
      .attr('y2', function(d) { return d * resolution; });

  var pointer = svg.selectAll()
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

  var shade = svg.selectAll()
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

  ctrl.select = function() {
    ctrl.inputMode = 'select';
    pointer.
      classed('hide', true)
    ;
  };

  ctrl.draw = function() {
    ctrl.inputMode = 'draw';
    pointer.
      classed('hide', false)
    ;
  };

  ctrl.useStraightLine = function() {
    ctrl.pathType = 'straight';
  };

  ctrl.useCurlyLine = function() {
    ctrl.pathType = 'curly';
  };

  ctrl.flipLast = function() {
    var last = ctrl.currentLine.path[ctrl.currentLine.path.length - 1];
    last.linePath.remove();
    last.flipped = !last.flipped;
    last.linePath = drawlinePath(last.x1, last.y1, last.x2, last.y2, last.type, last.flipped);
    ctrl.currentLine.path[ctrl.currentLine.path.length - 1] = last;
  };

  ctrl.newLine();
}])



;
