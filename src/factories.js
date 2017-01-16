angular.module('metro')

.factory('Metro', ['$timeout', 'metroHelper', function($timeout, helper) {
  function constructor(def) {
    this.width = def.width;
    this.height = def.height;
    this.resolution = def.resolution;
    this.metroLines = [];
    this.currentMetroLine = null;
    this.currentEditJoint = null;
    this.pointerRadius = def.pointerRadius || 10;
    this.container = def.container;
    this.elements = null;
    this.inputMode = def.inputMode || 'draw';
    this.shadePos = null;
    this.pathType = def.pathType || 'straight';
    this.evt = {
      jointMouseDown: null,
      jointDrag: null,
      splashButtonClick: null,
      canvasMouseClick: null
    };
    this.render();
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

      var layerJoints = metro.currentMetroLine.layers.joints;
      var jointData = layerJoints.select('.joint:last-child').datum();
      var linePath = jointData.linePath;
      var linePathData = linePath.datum();

      metro.setShadePos({x: linePathData.x2, y: linePathData.y2});
    };
  };

  var evtJointDrag = function(metro) {
    return function() {
          var r = metro.pointerRadius,
             x2 = helper.round(Math.max(r, Math.min(metro.width - r, d3.event.x)),
                               metro.resolution),
             y2 = helper.round(Math.max(r, Math.min(metro.height - r, d3.event.y)),
                               metro.resolution),

          joint = d3.select(this)
                    .attr('cx', x2)
                    .attr('cy', y2)
                    .classed('hover', true),

      jointData = joint.datum(),
       linePath = jointData.linePath,
   linePathData = linePath.datum(),
       shadePos = {x: x2, y: y2};
  
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
        metro.elements.shade
          .attr('cx', x2)
          .attr('cy', y2)
        ;
      }
      metro.notify('jointDrag', this, shadePos);
    };
  };

  var evtCanvasMouseMove = function(metro) {
    return function() {
      var pos = d3.mouse(this);
      metro.elements.pointer
        .attr('cx', function(d) { return helper.round(pos[0], metro.resolution); })
        .attr('cy', function(d) { return helper.round(pos[1], metro.resolution); })
      ;
    };
  };

  var evtCanvasMouseClick = function(metro) {
    return function() {
      if (metro.getMetroLines().length === 0) return;
      if (metro.inputMode != 'draw') return;
  
      var pos = d3.mouse(this);
      var x2 = helper.round(pos[0], metro.resolution);
      var y2 = helper.round(pos[1], metro.resolution);
      var shadePos = metro.getShadePos();
      var x1 = shadePos.x;
      var y1 = shadePos.y;
  
      var linePath = metro.drawLinePath(x1, y1, x2, y2, metro.getPathType(), false);
  
      metro.elements.shade
        .attr('cx', x2)
        .attr('cy', y2)
      ;

      shadePos = metro.setShadePos({x: x2, y: y2});
      metro.notify('canvasMouseClick', this, shadePos);
    };
  };

  var evtSlpashClick = function(metro) {
    return function() {
      $timeout(function() {
        metro.elements.svg.on('click', evtCanvasMouseClick(metro));
      }, 0);
      metro.elements.layerSplash.remove();
      metro.notify('splashButtonClick', this);
    };
  };

  metro.render = function(container) {
    var def = this;
    var svg = helper.drawCanvas(d3.select(this.container), def)
                    .on('mousemove', evtCanvasMouseMove(def));

    var layerGridlines = svg.append('g').attr('class', 'layer-group');
    var layerTop = svg.append('g').attr('class', 'layer-group');
    var layerSplash = svg.append('g').attr('class', 'splash');

    var splash = helper.drawSplashMask(layerSplash, def);
    var splashButton = helper.drawSplashButton(layerSplash, def)
                             .on('click', evtSlpashClick(def));
    var splashButtonText = helper.drawSplashButtonText(layerSplash, def)
                                 .on('click', evtSlpashClick(def));
    var gridlines = helper.drawGridlines(layerGridlines, def);
    var pointer = helper.drawPointer(layerTop, def);
    var shade = helper.drawShade(layerTop, def);

    this.elements = {
      svg: svg,
      layerGridlines: layerGridlines,
      layerTop: layerTop,
      layerSplash: layerSplash,
      pointer: pointer,
      shade: shade
    };

    return this.elements;
  };

  metro.getElements = function() {
    return this.elements;
  };

  metro.resetShadePos = function() {
    this.shadePos = {x: undefined, y: undefined};
  };

  metro.setShadePos = function(pos) {
    this.shadePos = pos;
    return pos;
  };

  metro.getShadePos = function() {
    return this.shadePos;
  };

  metro.setPathType = function(type) {
    this.pathType = type;
    return type;
  };

  metro.getPathType = function() {
    return this.pathType;
  };

  metro.setInputMode = function(mode) {
    this.inputMode = mode;
    return mode;
  };

  metro.getInputMode = function(mode) {
    return this.inputMode;
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

  metro.addMetroLine = function() {
    var layerMetroLine = this.elements.svg.append('g').attr('class', 'layer-group');
    var layerLinePaths = layerMetroLine.append('g');
    var layerJoints = layerMetroLine.append('g');
    var layerStations = layerMetroLine.append('g');
    var metroLine = angular.copy(schemas.metroLine);

    angular.extend(metroLine, {
      id: this.metroLines.length,
      layers: {
        metroLine: layerMetroLine,
        linePaths: layerLinePaths,
        joints: layerJoints,
        stations: layerStations
      }
    });

    this.resetShadePos();
    this.resetTopLayer();
    this.metroLines.push(metroLine);

    return metroLine;
  };

  metro.newMetroLine = function() {
    return angular.copy(schemas.metroLine);
  };

  metro.resetTopLayer = function() {
    var el = this.elements;
    el.svg.node().appendChild(el.layerTop.node());
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
    if (!this.evt.hasOwnProperty(name)) throw 'Event ' + name + ' is not supported';
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

  metro.newStation = function() {
    return angular.copy(schemas.station);
  };

  metro.drawLinePath = function(x1, y1, x2, y2, type, flipped, linePath, insertBefore) {
    var def = this;
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
        .attr('r', def.pointerRadius)
        .attr('class', 'joint')
        .on('mousedown', evtJointMouseDown(def))
        .call(
          d3.drag()
            .on('drag', evtJointDrag(def))
            .on('end', evtJointDragEnd(def))
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
