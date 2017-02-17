import * as helper from "./helpers";
import {MetroBBox} from "./bbox";

export class Metro {
  constructor(def) {
    this.width = def.width;
    this.height = def.height;
    this.resolution = def.resolution;
    this.pointerRadius = def.pointerRadius || 10;
    this.container = def.container;
    this.inputMode = def.inputMode || 'draw';
    this.pathType = def.pathType || 'straight';

    this.metroLines = [];
    this.currentMetroLine = null;
    this.currentEditJoint = null;
    this.elements = null;
    this.shadePos = null;
    this.shadePosDelta = {x: 0, y: 0, k: 1};
    this.zoom = d3.zoom().scaleExtent([0.3, 10]);

    this.evt = {
      jointMouseDown: () => {},
      jointDrag: () => {},
      splashButtonClick: () => {},
      canvasMouseClick: () => {},
      zooming: () => {}
    };

    this.run();
  };

  run() {
    const def = this;
    const svg = helper.drawCanvas(d3.select(this.container), def)
      .on('mousemove', evtCanvasMouseMove(def))
      .call(def.getZoom().on("zoom", evtCanvasZoom(def)))
    ;
    const layerZoomable = svg.append('g').attr('class', 'zoomable');
    const layerGridlines = layerZoomable.append('g').attr('class', 'layer-group');
    const layerTop = svg.append('g').attr('class', 'layer-group');
    const layerSplash = svg.append('g').attr('class', 'splash');

    const splash = helper.drawSplashMask(layerSplash, def);
    const splashButton = helper.drawSplashButton(layerSplash, def)
                               .on('click', evtSlpashClick(def));
    const splashButtonText = helper.drawSplashButtonText(layerSplash, def)
                                   .on('click', evtSlpashClick(def));
    const gridlines = helper.drawGridlines(layerGridlines, def);
    const pointer = helper.drawPointer(layerTop, def);
    const shade = helper.drawShade(layerTop, def);

    this.elements = {
      svg: svg,
      layerZoomable: layerZoomable,
      layerGridlines: layerGridlines,
      layerTop: layerTop,
      layerSplash: layerSplash,
      pointer: pointer,
      shade: shade
    };

    return this.elements;
  };

  updateBBox() {
    const def = this;
    const metroLine = this.getCurrentMetroLine();
    const pathString = this.getPathString(metroLine);
    const guide = helper.drawGuide(metroLine.guide, pathString);
    const guideData = guide.datum() || {};

    if (guideData.bbox) {
      guideData.bbox.reload();
    } else {
      const bbox = new MetroBBox({
        selection: guide,
        container: metroLine.layers.stations,
        resolution: this.resolution,//for snap,
        width: this.width,
        height: this.height
      });
      bbox.listen();
      bbox.on('resized', evtBBoxResized(def));
      guide.datum({bbox: bbox});
    }
  };

  getZoom() {
    return this.zoom;
  };

  getElements() {
    return this.elements;
  };

  resetShadePos() {
    this.shadePos = {x: undefined, y: undefined};
  };

  setShadePosDelta(pos) {
    this.shadePosDelta = pos;
    return pos;
  };

  getShadePosDelta(pos) {
    return this.shadePosDelta;
  };

  setShadePos(pos) {
    this.shadePos = pos;
    return pos;
  };

  getShadePos() {
    return this.shadePos;
  };

  moveShadePos(pos) {
    if (this.elements.shade) {
      this.elements.shade
        .attr('cx', pos.x)
        .attr('cy', pos.y)
      ;
    }
  };

  setPathType(type) {
    this.pathType = type;
    return type;
  };

  getPathType() {
    return this.pathType;
  };

  setInputMode(mode) {
    this.inputMode = mode;
    return mode;
  };

  getInputMode(mode) {
    return this.inputMode;
  };

  setPointerRadius(r) {
    this.pointerRadius = r;
  };

  getPointerRadius() {
    return this.pointerRadius;
  };

  setCurrentMetroLine(m) {
    if (this.currentMetroLine) {
      this.currentMetroLine.layers.metroLine.classed('current-metroline', false);
    }
    m.layers.metroLine.classed('current-metroline', true);
    this.currentMetroLine = m;
  };

  getCurrentMetroLine() {
    return this.currentMetroLine;
  };

  getMetroLineById(id) {
    return this.metroLines.filter(line => line.id == id)[0];
  };

  addMetroLine() {
    const layerMetroLine = this.elements.layerZoomable.append('g').attr('class', 'layer-group');
    const layerLinePaths = layerMetroLine.append('g');
    const layerGuide = layerMetroLine.append('g');
    const layerJoints = layerMetroLine.append('g');
    const layerStations = layerMetroLine.append('g');
    const metroLine = angular.copy(schemas.metroLine);
    const guide = layerGuide.append('path').attr('class', 'guide');

    angular.extend(metroLine, {
      id: this.metroLines.length,
      layers: {
        metroLine: layerMetroLine,
        linePaths: layerLinePaths,
        joints: layerJoints,
        stations: layerStations,
      },
      guide: guide
    });

    this.resetShadePos();
    this.resetTopLayer();
    this.metroLines.push(metroLine);

    return metroLine;
  };

  newMetroLine() {
    return angular.copy(schemas.metroLine);
  };

  resetTopLayer() {
    let el = this.elements;
    el.svg.node().appendChild(el.layerTop.node());
  };

  getMetroLines() {
    return this.metroLines;
  };

  setCurrentEditJoint(j) {
    this.currentEditJoint = j;
  };

  getCurrentEditJoint() {
    return this.currentEditJoint;
  };

  on(name, cb) {
    if (!this.evt.hasOwnProperty(name)) throw 'Event ' + name + ' is not supported';
    this.evt[name] = cb;
  };

  notify(name, context) {
    let args = Array.from(arguments)
    args.splice(0, 2);
    this.evt[name].apply(context, args);
  };

  addStationObject(station) {
    this.currentMetroLine.stations.push(station);
  };

  getPathString(metroLine) {
    let d = metroLine.layers.linePaths.selectAll('.rail').data();
    d.shift();
    return d.map(function(p){return p.pathString}).join(',');
  };

  newStation() {
    return angular.copy(schemas.station);
  };

  drawLinePath(x1, y1, x2, y2, type, flipped, linePath, insertBefore) {
    const def = this;
    const metroLine = this.getCurrentMetroLine();
    const layerLinePaths = metroLine.layers.linePaths;
    let layerJoints = metroLine.layers.joints;
    const isHead = typeof x1 != 'undefined' && typeof x2 != 'undefined';
    let path = d3.path();
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
    const pathString = path.toString();
    if (linePath) {
      linePath
        .attr(isHead ? 'd' : '_d', pathString)
        .classed('rail', true)
    } else {
      let beforeIndex;
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

      let joint = layerJoints.selectAll()
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

    this.updateBBox();

    return linePath;
  };
}

const evtJointMouseDown = function(metro) {
  return function() {
    const currentJointData = metro.getCurrentEditJoint();
    if (currentJointData) {
      d3.select(currentJointData.joint).classed('current', false);
    }
    d3.select(this).classed('current', true);

    const linePath = d3.select(this).datum().linePath;

    const jointData = {
      linePath: linePath,
      joint: this,
      data: linePath.datum()
    };

    metro.setCurrentEditJoint(jointData);
    metro.notify('jointMouseDown', this, jointData);
  };
};

const evtJointDragEnd = function(metro) {
  return function() {
    d3.select(this).classed('hover', false);
    metro.currentEditJoint.data = d3.select(this).datum().linePath.datum();

    const layerJoints = metro.currentMetroLine.layers.joints;
    const jointData = layerJoints.select('.joint:last-child').datum();
    const linePath = jointData.linePath;
    const linePathData = linePath.datum();

    const x = linePathData.x2;
    const y = linePathData.y2;

    const delta = metro.getShadePosDelta();
    metro.moveShadePos({x: x * delta.k + delta.x, y: y * delta.k + delta.y});
    metro.setShadePos({x: x, y: y});
  };
};

const evtJointDrag = function(metro) {
  return function() {
    const r = metro.pointerRadius;
    const x2 = helper.round(d3.event.x, metro.resolution);
    const y2 = helper.round(d3.event.y, metro.resolution);
    const joint = d3.select(this)
                    .attr('cx', x2)
                    .attr('cy', y2)
                    .classed('hover', true);
    let jointData = joint.datum();
    const linePath = jointData.linePath;
    const linePathData = linePath.datum();

    metro.drawLinePath(
      linePathData.x1, linePathData.y1,
      x2, y2,
      linePathData.type,
      linePathData.flipped,
      linePath
    );

    if (d3.select(this.nextElementSibling).size() > 0) {
      const nextSibling = d3.select(this.nextElementSibling);
      const nextSiblingData = nextSibling.datum();
      const nextSiblingLinePath = nextSiblingData.linePath;
      const nextSiblingLinePathData = nextSiblingLinePath.datum();
      metro.drawLinePath(
        x2, y2,
        nextSiblingLinePathData.x2, nextSiblingLinePathData.y2,
        nextSiblingLinePathData.type,
        nextSiblingLinePathData.flipped,
        nextSiblingLinePath
      );
    }

    const delta = metro.getShadePosDelta();
    const shadePos = {x: x2 * delta.k + delta.x, y: y2 * delta.k + delta.y};

    jointData = {
      linePath: linePath,
      joint: this,
      data: linePathData
    };
    metro.notify('jointDrag', this, jointData);
  };
};

const evtSlpashClick = function(metro) {
  return function() {
    setTimeout(function() {
      metro.elements.svg.on('click', evtCanvasMouseClick(metro));
    }, 0);
    metro.elements.layerSplash.remove();
    metro.notify('splashButtonClick', this);
  };
};

const evtCanvasMouseClick = function(metro) {
  return function() {
    if (metro.getMetroLines().length === 0) return;
    if (metro.inputMode != 'draw') return;

    const delta = metro.getShadePosDelta();
    const pos = d3.mouse(this);
    let shadePos = metro.getShadePos();
    const x1 = shadePos.x;
    const y1 = shadePos.y;
    let x2 = helper.round(pos[0], metro.resolution * delta.k);
    let y2 = helper.round(pos[1], metro.resolution * delta.k);

    metro.moveShadePos({x: x2, y: y2});

    x2 = (x2 - delta.x)/delta.k;
    y2 = (y2 - delta.y)/delta.k;

    const linePath = metro.drawLinePath(x1, y1, x2, y2, metro.getPathType(), false);
    
    shadePos = metro.setShadePos({x: x2, y: y2});
    metro.notify('canvasMouseClick', this, shadePos);
  };
};

const evtCanvasMouseMove = function (metro) {
  return function() {
    const delta = metro.getShadePosDelta();
    const pos = d3.mouse(this);
    metro.elements.pointer
      .attr('cx', function(d) { return helper.round(pos[0], metro.resolution * delta.k); })
      .attr('cy', function(d) { return helper.round(pos[1], metro.resolution * delta.k); })
    ;
  };
};

const evtCanvasZoom = function(metro) {
  return function() {
    const t = d3.event.transform;
    const k = t.k;
    const x = helper.round(t.x, metro.resolution * k);
    const y = helper.round(t.y, metro.resolution * k);
    
    metro.elements.layerZoomable
      .attr("transform",
        "translate(" + x + "," + y + ")scale(" + k + ")");

    if (metro.shadePos && metro.shadePos.x && metro.shadePos.y) {
      metro.moveShadePos({x: metro.shadePos.x * k + x, y: metro.shadePos.y * k + y});
    }
    metro.setShadePosDelta({x: x, y: y, k: k});
    metro.notify('zooming', this, t);
  };
};

const evtBBoxResized = function(metro) {
  return function(transform) {
    let metroLine = metro.getCurrentMetroLine();
    metroLine.layers.joints.selectAll('.joint').each(function(joint) {
      const linePath = joint.linePath;
      const d = linePath.datum();
      if (d.x1) d.x1 = d.x1 * transform.scaleX + transform.translateX;
      if (d.y1) d.y1 = d.y1 * transform.scaleY + transform.translateY;
      if (d.x2) d.x2 = d.x2 * transform.scaleX + transform.translateX;
      if (d.y2) d.y2 = d.y2 * transform.scaleY + transform.translateY;

      metro.drawLinePath(
        d.x1, d.y1,
        d.x2, d.y2,
        d.type,
        d.flipped,
        linePath
      );

      d3.select(this)
        .attr('cx', d.x2)
        .attr('cy', d.y2)
      ;

      const delta = metro.getShadePosDelta();
      metro.moveShadePos({x: d.x2 * delta.k + delta.x, y: d.y2 * delta.k + delta.y});
      metro.setShadePos({x: d.x2, y: d.y2});
    });
  };
};

const schemas = {
  metroLine: {
    id: -1,
    name: '',
    layers: {

    },
    paths: [],
    stations: [],
    style: {
      color: '',
    }
  },
  station: {
    id: -1,
    position: 0,
    name: '',
    color: ''
  }
};
