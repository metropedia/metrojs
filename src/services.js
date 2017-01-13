angular.module('metro')

.service('metro', [function() {
  var service = this;
  var currentMetroLine = null;
  var currentEditJoint = null;
  var pointerR;
  var evt = {};

  service.setCurrentMetroLine = m => { currentMetroLine = m; };
  service.getCurrentMetroLine = () => { return currentMetroLine; };
  service.setCurrentEditJoint = j => { currentEditJoint = j; };
  service.setPointerR = r => { PointerR = r; return r; };

  service.on = (name, cb) => {
    evt[name] = cb;
  };

  service.addStationObject = station => {
    currentMetroLine.stations.push(station);
  };

  service.drawLinePath = function(x1, y1, x2, y2, type, flipped, linePath, insertBefore) {
    var layerMetroLine = currentMetroLine.layers.metroLine;
    var layerLinePaths = currentMetroLine.layers.linePaths;
    var layerJoints = currentMetroLine.layers.joints;

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
        .attr('r', pointerR)
        .attr('class', 'joint')
        .on('mousedown', function() {
          if (currentEditJoint) {
            d3.select(currentEditJoint.joint)
              .classed('current', false);
          }
          d3.select(this).classed('current', true);
          currentEditJoint = {
            linePath: linePath,
            joint: this,
            data: d3.select(this).datum().linePath.datum()
          }; this;
          $scope.$apply();
          console.log(currentEditJoint.data)
        })
        .call(
          d3.drag()
            .on('drag', evt['jointDrag'])
            .on('end', function() {
              d3.select(this).classed('hover', false);
              currentEditJoint.data = d3.select(this).datum().linePath.datum();
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
}])
;
