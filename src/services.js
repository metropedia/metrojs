angular.module('metro')

.factory('Metro', [function() {
  function constructor(def) {
    this.metroLines = [];
    this.currentMetroLine = null;
    this.currentEditJoint = null;
    this.pointerRadius = def.pointerRadius || 10;
    this.evt = {
      jointMouseDown: null,
      jointDrag: null
    };
  }

  var metro = constructor.prototype;

  var schemas = {
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

  var evtJointMouseDown = function(metro) {
    return function() {
      var jointData = metro.getCurrentEditJoint();
      if (jointData) {
        d3.select(jointData.joint).classed('current', false);
      }
      d3.select(this).classed('current', true);
  
      var linePath = d3.select(this).datum().linePath;
      var data = linePath.datum();
      var jointData = {
        linePath: linePath,
        joint: this,
        data: data
      };

      metro.setCurrentEditJoint(jointData);
      metro.notify('jointMouseDown', this, jointData);
    };
  };

  var evtJointDragEnd = function(metro) {
    return function() {
      d3.select(this).classed('hover', false);
      metro.currentEditJoint.data = d3.select(this).datum().linePath.datum();
    };
  };

  metro.setPointerRadius = function(r) {
    this.pointerRadius = r;
  };

  metro.getPointerRadius = function() {
    return this.pointerRadius;
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

  metro.getCurrentEditJoint = function() {
    return this.currentEditJoint;
  };

  metro.on = function(name, cb) {
    if (!this.evt.hasOwnProperty(name)) throw 'Event is not supported';
    this.evt[name] = cb;
  };

  metro.notify = function(name, context) {
    var args = Array.from(arguments)
    args.splice(0, 2);
    this.evt[name].apply(context, args);
  };

  metro.addStationObject = function(station) {
    this.currentMetroLine.stations.push(station);
  };

  metro.getPathString = function(metroLine) {
    var d = metroLine.layers.linePaths.selectAll('.rail').data();
    d.shift();
    return d.map(function(p){return p.pathString}).join(',');
  };

  metro.newMetroLine = function() {
    return angular.copy(schemas.metroLine);
  };

  metro.newStation = function() {
    return angular.copy(schemas.station);
  };

  metro.drawLinePath = function(x1, y1, x2, y2, type, flipped, linePath, insertBefore) {
    var metro = this;
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
        .attr('r', metro.pointerRadius)
        .attr('class', 'joint')
        .on('mousedown', evtJointMouseDown(metro))
        .call(
          d3.drag()
            .on('drag', metro.evt.jointDrag)
            .on('end', evtJointDragEnd(metro))
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
