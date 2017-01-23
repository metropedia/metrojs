angular.module('metro')

.factory('metroBBox', ['metroHelper', function(helper) {
  function constructor(def) {
    this.SELECTION = def.selection;
    this.CONTAINER = def.container;
    this.RESOLUTION = def.resolution;
    this.WIDTH = def.width;
    this.HEIGHT = def.height;
    this.elements = null;
    this.events = {};
    this.pointerPos = null;
    this.transform = null;
    this.orig = null;
  }

  var proto = constructor.prototype;

  proto.getElements = function() {
    return this.elements;
  };

  proto.setElements = function(area, tl, tr, br, bl, top, right, bottom, left) {
    this.elements = {
      area: area,
      tl: tl,
      tr: tr,
      br: br,
      bl: bl,
      top: top,
      right: right,
      bottom: bottom,
      left: left
    };
  };

  proto.setOrigin = function(bbox) {
    var obj = {};
    for (var p in bbox) {
      obj[p] = bbox[p];
    }
    this.orig = obj;
  };

  proto.getOrigin = function() {
    return this.orig;
  };

  proto.setLastEvent = function(xy) {
    this.pointerPos = xy;
  };

  proto.getLastEvent = function() {
    return this.pointerPos;
  };

  proto.setTransform = function(t) {
    this.transform = t;
  };

  proto.getTransform = function() {
    return this.transform;
  };

  proto.snap = function(n) {
    return helper.round(n, this.RESOLUTION);
  };

  var evtHandleDrag = function(proto, dir) {
    return function() {
      var x = proto.snap(d3.event.x);
      var y = proto.snap(d3.event.y);
      var pointerPos = proto.getLastEvent();
      var dest;
      var orig = proto.getOrigin();

      // skip same snapped positions
      if (pointerPos) {
        if (pointerPos.x === x && pointerPos.y === y) {
          //console.log('ignored');
          return;
        }
      }
      proto.setLastEvent({x: x, y: y});
      //console.log('updating');

      if (dir == 'tl') {
        dest = {
          x: x,
          y: y,
          width: orig.x + orig.width - x,
          height: orig.y + orig.height - y
        };
      } else if (dir == 'top') {
        dest = {
          x: orig.x,
          y: y,
          width: orig.width,
          height: orig.y + orig.height - y
        };
      } else if (dir == 'tr') {
        dest = {
          x: orig.x,
          y: y,
          width: x - orig.x,
          height: orig.y + orig.height - y
        };
      } else if (dir == 'right') {
        dest = {
          x: orig.x,
          y: orig.y,
          width: x - orig.x,
          height: orig.height
        };
      } else if (dir == 'br') {
        dest = {
          x: orig.x,
          y: orig.y,
          width: x - orig.x,
          height: y - orig.y
        };
      } else if (dir == 'bottom') {
        dest = {
          x: orig.x,
          y: orig.y,
          width: orig.width,
          height: y - orig.y
        };
      } else if (dir == 'bl') {
        dest = {
          x: x,
          y: orig.y,
          width: orig.x + orig.width - x,
          height: y - orig.y
        };
      } else if (dir == 'left') {
        dest = {
          x: x,
          y: orig.y,
          width: orig.x + orig.width - x,
          height: orig.height
        };
      }

      var transform = proto.update(dest);

      proto.SELECTION
        .attr('transform', ''
         +'translate(' + transform.translateX + ', ' + transform.translateY + ')'
         +'scale(' + transform.scaleX + ', ' + transform.scaleY + ')'
        )
      ;

      proto.setTransform(transform);
    };
  };

  var evtHandleDragStart = function(proto, dir) {
    return function() {
      console.log('start')
    };
  };

  var evtHandleDragEnd = function(proto, dir) {
    return function() {
      // Must transform scaled and translated shape back into original
      // and remove attributes translate and scale
      var transform = proto.getTransform();
      if (!transform) return;
      //console.log(transform)
      //console.log(proto.SELECTION.attr('d'))
      var pathString = helper.transformPathString(proto.SELECTION.attr('d'), transform);
      helper.drawGuide(proto.SELECTION, pathString);
      //console.log(pathString)

      proto.broadcast('resized', transform);
      proto.reset();
      console.log('end')
    };
  };

  proto.on = function(evt, cb) {
    this.events[evt] = cb;
  };

  proto.broadcast = function(evt, data) {
    this.events[evt].apply(this, [data]);
  };

  proto.reset = function() {
    var transform = {
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
    };

    this.SELECTION
      .attr('transform', ''
       +'translate(' + transform.translateX + ', ' + transform.translateY + ')'
       +'scale(' + transform.scaleX + ', ' + transform.scaleY + ')'
      )
    ;

    var elements = this.getElements();
    if (elements) {
      for (var p in elements) {
        elements[p].remove();
      }
      this.setElements();
    };

    this.setTransform(null);
    this.setLastEvent(null);

    this.setOrigin(
      this.SELECTION.node().getBBox()
    );
    this.render();
    this.update();
  };

  proto.render = function() {
    var proto = this;
    var area = this.CONTAINER.append('rect')
      .style('fill', 'none')
      .classed('bb-line', true)
      .attr('vector-effect', 'non-scaling-stroke')
    ;
    var tl = this.CONTAINER.append('rect')
      .classed('bb-line tl', true)
      .style('cursor', 'nwse-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'tl'))
          .on('drag', evtHandleDrag(proto, 'tl'))
          .on('end', evtHandleDragEnd(proto, 'tl'))
      )
    ;
    var top = this.CONTAINER.append('rect')
      .classed('bb-line top', true)
      .style('cursor', 'ns-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'top'))
          .on('drag', evtHandleDrag(proto, 'top'))
          .on('end', evtHandleDragEnd(proto, 'top'))
      )
    ;
    var tr = this.CONTAINER.append('rect')
      .classed('bb-line tr', true)
      .style('cursor', 'nesw-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'tr'))
          .on('drag', evtHandleDrag(proto, 'tr'))
          .on('end', evtHandleDragEnd(proto, 'tr'))
      )
    ;
    var right = this.CONTAINER.append('rect')
      .classed('bb-line right', true)
      .style('cursor', 'ew-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'right'))
          .on('drag', evtHandleDrag(proto, 'right'))
          .on('end', evtHandleDragEnd(proto, 'right'))
      )
    ;
    var br = this.CONTAINER.append('rect')
      .classed('bb-line br', true)
      .style('cursor', 'nwse-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'br'))
          .on('drag', evtHandleDrag(proto, 'br'))
          .on('end', evtHandleDragEnd(proto, 'br'))
      )
    ;
    var bottom = this.CONTAINER.append('rect')
      .classed('bb-line bottom', true)
      .style('cursor', 'ns-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'bottom'))
          .on('drag', evtHandleDrag(proto, 'bottom'))
          .on('end', evtHandleDragEnd(proto, 'bottom'))
      )
    ;
    var bl = this.CONTAINER.append('rect')
      .classed('bb-line bl', true)
      .style('cursor', 'nesw-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'bl'))
          .on('drag', evtHandleDrag(proto, 'bl'))
          .on('end', evtHandleDragEnd(proto, 'bl'))
      )
    ;
    var left = this.CONTAINER.append('rect')
      .classed('bb-line left', true)
      .style('cursor', 'ew-resize')
      .attr('vector-effect', 'non-scaling-stroke')
      .call(
        d3.drag()
          .on('start', evtHandleDragStart(proto, 'left'))
          .on('drag', evtHandleDrag(proto, 'left'))
          .on('end', evtHandleDragEnd(proto, 'left'))
      )
    ;
    this.setElements(area, tl, tr, br, bl, top, right, bottom, left);
  };

  proto.listen = function() {
    var elements = this.getElements();
    if (!elements) {
      this.render();
    }

    this.setOrigin(
      this.SELECTION.attr('vector-effect', 'non-scaling-stroke').node().getBBox()
    );

    this.update();
  };

  proto.reload  = function() {
    this.listen();
  };

  proto.update = function(dest) {
    var el = this.getElements(),
        orig = this.getOrigin(),
        b = dest || orig
    ;

    var handle = [
      { name: 'tl',
        value: { x: b.x -5, y: b.y -5, width: 10, height: 10 } },
      { name: 'top',
        value: { x: b.x + b.width/2 -5, y: b.y -5, width: 10, height: 10 } },
      { name: 'tr',
        value: { x: b.x + b.width -5, y: b.y -5, width: 10, height: 10 } },
      { name: 'right',
        value: { x: b.x + b.width -5, y: b.y + b.height/2 -5, width: 10, height: 10 } },
      { name: 'br',
        value: { x: b.x + b.width -5, y: b.y + b.height -5, width: 10, height: 10, } },
      { name: 'bottom',
        value: { x: b.x + b.width/2 -5, y: b.y + b.height -5, width: 10, height: 10 } },
      { name: 'bl',
        value: { x: b.x -5, y: b.y + b.height -5, width: 10, height: 10 } },
      { name: 'left',
        value: { x: b.x -5, y: b.y + b.height/2 -5, width: 10, height: 10 } },
    ];

    var sorted = angular.copy(handle);
    var areas = sorted.map(function(h){
      return Math.abs(h.value.x * h.value.y);
    });

    // calculate area size in order to find upper left corner
    var min = areas.indexOf(Math.min.apply(Math, areas));
    var max = areas.indexOf(Math.max.apply(Math, areas));
    console.log(min, sorted[min].name, max, sorted[max].name);

    sorted = [].concat(
      sorted.slice(min, sorted.length)
    ).concat(
      sorted.slice(0, min)
    );

    var swap;
    if (min + max === 2) {
      // void area, not possible
    } else if (min + max === 8) {
      // bilateral symmetry
      //console.log('bilateral symmetry')
      swap = sorted[min-1];
      sorted[min-1] = sorted[min+1];
      sorted[min+1] = swap;
      swap = sorted[max-1];
      sorted[max-1] = sorted[max+1];
      sorted[max+1] = swap;
    } else {
      //console.log('point reflection')
    }

    //console.log(sorted);
    var temp = {};
    handle.forEach(function(h, i){
      temp[h.name] = sorted[i].value;
    });
    handle = temp;
    //console.log(handle);

    handle.area = {
      x: handle['tl'].x +5, y: handle['tl'].y +5,
      width: Math.abs(b.width), height: Math.abs(b.height)
    };

    el.area
      .attrs(handle.area);
    el.tl
      .attrs(handle.tl);
    el.top
      .attrs(handle.top);
    el.tr
      .attrs(handle.tr);
    el.right
      .attrs(handle.right);
    el.br
      .attrs(handle.br);
    el.bottom
      .attrs(handle.bottom);
    el.bl
      .attrs(handle.bl);
    el.left
      .attrs(handle.left);

    if (dest) {
      var scaleX = dest.width/orig.width || 0.000001;
      var scaleY = dest.height/orig.height || 0.000001;
      return {
        scaleX: scaleX,
        scaleY: scaleY,
        translateX: -(orig.x)*(scaleX-1)+(handle.area.x-orig.x) + (scaleX < 0 ? handle.area.width : 0),
        translateY: -(orig.y)*(scaleY-1)+(handle.area.y-orig.y) + (scaleY < 0 ? handle.area.height : 0),
      };
    } else  {
      return {
        scaleX: 1,
        scaleY: 1,
        translateX: 0,
        translateY: 0,
      };
    };
  };

  return constructor;
}])
;
