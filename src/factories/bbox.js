angular.module('metro')

.factory('metroBBox', ['metroHelper', function(helper) {
  function constructor(def) {
    this.selection = def.selection;
    this.container = def.container;
    this.pointerRadius = def.pointerRadius;
    this.width = def.width;
    this.height = def.height;
    this.resolution = def.resolution;
    this.elements = null;
    this.orig = {};
  }

  var proto = constructor.prototype;

  proto.getSelection = function() {
    return this.selection;
  };

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
    this.orig = angular.extend(this.orig, obj);
  };

  proto.getOrigin = function() {
    return this.orig;
  };

  proto.snap = function(n) {
    var r = this.pointerRadius;
    return helper.round(Math.max(r, Math.min(this.width - r, n)), this.resolution);
  };

  var evtHandleDrag = function(proto, dir) {
    return function() {
      var x = proto.snap(d3.event.x);
      var y = proto.snap(d3.event.y);
      var dest;
      var orig = proto.getOrigin();
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

      if ( dest.width <= 0 || dest.height <= 0 ) {
        var el = proto.getElements();
        var corners = [el.tl, el.tr, el.br, el.bl]
        var cornersBBox = corners
          .map(function(c){
            return c.node().getBBox();
          })
        ;
        var cornersAreas = cornersBBox
          .map(function(b){
            return b.x * b.y
          })
        ;
        var tl = cornersAreas.indexOf(Math.min.apply(Math, cornersAreas));
        var br = cornersAreas.indexOf(Math.max.apply(Math, cornersAreas));
        var tlbb = cornersBBox[tl];
        var brbb = cornersBBox[br];

        var area = {
          x: tlbb.x +5,
          y: tlbb.y +5,
          width: brbb.x - tlbb.x,
          height: brbb.y - tlbb.y
        };
        var scaleX = area.width/orig.width;
        var scaleY = area.height/orig.height;
        proto.update(dest, area);
        proto.dest = area;
      } else {
        var scaleX = dest.width/orig.width;
        var scaleY = dest.height/orig.height;
        var area = dest;
        proto.update(dest);
        proto.dest = dest;
      }

      proto.getSelection()
        .attr('transform', ''
         +'translate(' + (-(orig.x)*(scaleX-1)+(area.x-orig.x))
                + ', ' + (-(orig.y)*(scaleY-1)+(area.y-orig.y)) + ')'
         +'scale(' + scaleX + ', ' + scaleY + ')'
        )
      ;
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
      /*
      var b = proto.getElements().area.node().getBoundingClientRect();
      proto.setOrigin({ x: b.left, y: b.top, width: b.width, height: b.height });
      */
      console.log('end')
    };
  };

  proto.listen = function() {
    var proto = this;
    var elements = this.getElements();
    if (!elements) {
      var area = this.container.append('rect')
        .style('fill', 'none')
        .classed('bb-line', true)
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var tl = this.container.append('rect')
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
      var top = this.container.append('rect')
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
      var tr = this.container.append('rect')
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
      var right = this.container.append('rect')
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
      var br = this.container.append('rect')
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
      var bottom = this.container.append('rect')
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
      var bl = this.container.append('rect')
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
      var left = this.container.append('rect')
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
    }
    this.setOrigin(
      this.getSelection().attr('vector-effect', 'non-scaling-stroke').node().getBBox()
    );
    this.update();
  };

  proto.update = function(bbox, area) {
    var b = bbox || this.getOrigin();
    var el = this.getElements();
    el.tl
      .attrs({ x: b.x -5, y: b.y -5, width: 10, height: 10, });
    el.top
      .attrs({ x: b.x + b.width/2 -5, y: b.y -5, width: 10, height: 10, });
    el.tr
      .attrs({ x: b.x + b.width -5, y: b.y -5, width: 10, height: 10, });
    el.right
      .attrs({ x: b.x + b.width -5, y: b.y + b.height/2 -5, width: 10, height: 10, });
    el.br
      .attrs({ x: b.x + b.width -5, y: b.y + b.height -5, width: 10, height: 10, });
    el.bottom
      .attrs({ x: b.x + b.width/2 -5, y: b.y + b.height -5, width: 10, height: 10, });
    el.bl
      .attrs({ x: b.x -5, y: b.y + b.height -5, width: 10, height: 10, });
    el.left.
      attrs({ x: b.x -5, y: b.y + b.height/2 -5, width: 10, height: 10, });

    var area = area ? area : b;
    el.area
      .attrs({ x: area.x, y: area.y, width: area.width, height: area.height, });
  };

  return constructor; 
}])
;
