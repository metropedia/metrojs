import * as d3 from "d3";
import Metro from "./core-modules/metro";

angular.module('metro', [])

.controller('metroDesigner', [
  '$scope', '$element', '$compile', '$templateRequest',
  function($scope, $element, $compile, $templateRequest){

  var root = $element[0];
  var viewport = root.querySelector('.panel-north');
  var def = {
    pointerRadius: 10,
    width: viewport.clientWidth,
    height: 500,
    resolution: 20,
    container: $element.find('div')[1],
    inputMode: 'draw',
    pathType: 'straight',
  };

  var metro = new Metro(def);

  var app = this;
      app.foo = 'bar';
      app.metroLines = [];
      app.currentEditJoint = null;
      app.inputMode = metro.getInputMode();
      app.pathType = metro.getPathType();
      app.scalePercentage = 100.00;
      app.canvasWidth = metro.width;
      app.canvasHeight = metro.height;

  metro.on('zooming', function(transform) {
    app.scalePercentage = (transform.k * 100).toFixed(2);
    $scope.$apply();
  });

  metro.on('jointDrag', function(jointData) {
    app.currentEditJoint = jointData;
    $scope.$apply();
  });

  metro.on('jointMouseDown', function(jointData) {
    app.currentEditJoint = jointData;
    $scope.$apply();
  });

  metro.on('splashButtonClick', function() {
    app.newMetroLine();
    $scope.$apply();
  });

  metro.on('canvasMouseClick', function(shadePos) {
    //console.log(shadePos)
  });

  app.zoomIn = function() {
    metro.getElements().svg.transition().call(
      metro.getZoom().scaleBy, 1.5
    );
  }; 

  app.zoomOut = function() {
    metro.getElements().svg.transition().call(
      metro.getZoom().scaleBy, 0.75
    );
  }; 

  app.center = function(x, y, k) {
    metro.getElements().svg.transition().call(
      metro.getZoom().transform, d3.zoomIdentity.translate(x||0, y||0).scale(k || 1)
    );
  }; 

  app.newMetroLine = function() {
    var metroLine = metro.addMetroLine();
    metro.setCurrentMetroLine(metroLine);
    app.metroLines = metro.getMetroLines();
  };

  app.editMetroLine = function() {
    app.inputMode = metro.setInputMode('edit');
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

  app.draw = function() {
    app.inputMode = metro.setInputMode('draw');
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

  app.useStraightPath = function() {
    app.pathType = metro.setPathType('straight');
  };

  app.useCurlyPath = function() {
    app.pathType = metro.setPathType('curly');
  };

  app.flipLast = function() {
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

  app.applyLinePathChange = function() {
    var linePathJoint = metro.getCurrentEditJoint();
    metro.drawLinePath(
      linePathJoint.data.x1, linePathJoint.data.y1,
      linePathJoint.data.x2, linePathJoint.data.y2,
      linePathJoint.data.type,
      linePathJoint.data.flipped,
      linePathJoint.linePath
    );
  };

  app.splitLinePath = function() {
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

  var startWith = 0.76;
  app.center(app.canvasWidth/2*(1-startWith), app.canvasHeight/2*(1-startWith), startWith);
}])



;
