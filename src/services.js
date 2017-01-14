angular.module('metro')

.factory('Metro', [function() {
  function constructor() {
    this.metroLines = [];
    this.currentMetroLine = null;
    this.currentEditJoint = null;
    this.pointerR;
    this.evt = {};
  }

  var metro = constructor.prototype;

  metro.setPointerR = function(r) {
    this.pointerR = r;
  };

  metro.getPointerR = function() {
    return this.pointerR;
  };

  metro.setCurrentMetroLine = function(m) {
    this.currentMetroLine = m;
  };

  metro.getCurrentMetroLine = function() {
    return this.currentMetroLine;
  };

  metro.getMetroLineById = function(id) {
    return this.metroLines.filter(line => line.id == id)[0];
  };

  metro.addMetroLine = function(metroLine) {
    this.metroLines.push(metroLine);
  };

  metro.getMetroLines = function() {
    return this.metroLines;
  };

  metro.setCurrentEditJoint = function(j) {
    this.currentEditJoint = j;
  };

  metro.on = function(name, cb) {
    this.evt[name] = cb;
  };

  metro.addStationObject = function(station) {
    this.currentMetroLine.stations.push(station);
  };

  metro.getPathString = function(metroLine) {
    var d = metroLine.layers.linePaths.selectAll('.rail').data();
    d.shift();
    return d.map(function(p){return p.pathString}).join(',');
  };

  metro.drawLinePath = function(x1, y1, x2, y2, type, flipped, linePath, insertBefore) {
    var _this = this;
    var layerMetroLine = this.currentMetroLine.layers.metroLine;
    var layerLinePaths = this.currentMetroLine.layers.linePaths;
    var layerJoints = this.currentMetroLine.layers.joints;
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
        .attr('r', _this.pointerR)
        .attr('class', 'joint')
        .on('mousedown', function() {
          if (_this.currentEditJoint) {
            d3.select(_this.currentEditJoint.joint)
              .classed('current', false);
          }
          d3.select(this).classed('current', true);
          _this.currentEditJoint = {
            linePath: linePath,
            joint: this,
            data: d3.select(this).datum().linePath.datum()
          }; this;
          $scope.$apply();
          console.log(_this.currentEditJoint.data)
        })
        .call(
          d3.drag()
            .on('drag', _this.evt['jointDrag'])
            .on('end', function() {
              d3.select(this).classed('hover', false);
              _this.currentEditJoint.data = d3.select(this).datum().linePath.datum();
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

  return constructor; 
}])
;
