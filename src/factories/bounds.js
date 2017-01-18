angular.module('metro')

.factory('Bounds', ['metroHelper', function(helper) {
  function constructor(def) {
    this.selection = def.selection;
    this.container = def.container;
    this.pointerRadius = def.pointerRadius;
    this.width = def.width;
    this.height = def.height;
    this.resolution = def.resolution;
    this.rect = null;
    this.delta = null;
    this.run();
  }

  var bnd = constructor.prototype;

  bnd.run = function() {
    this.selection
      .datum({bounds: this})
    ;
  };

  bnd.getbb = function() {
    return this.bb;
  };

  bnd.setbb = function(rect, tl, tr, br, bl, top, right, bottom, left) {
    this.bb = {
      rect: rect,
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

  var evtHandleDrag = function(bnd, dir) {
    return function() {
      dir = bnd.dir || dir;
      var r = bnd.pointerRadius,
          x = helper.round(Math.max(r, Math.min(bnd.width - r, d3.event.x)),
                           bnd.resolution),
          y = helper.round(Math.max(r, Math.min(bnd.height - r, d3.event.y)),
                           bnd.resolution)
      ;
      var dest;
      var orig = bnd.orig;
      var w, h;
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
        if (dir == 'tl') {
          bnd.dir = 'br';
          bnd.orig = {
            x: orig.x + orig.width,
            y: orig.y + orig.height,
            width: 0,
            height: 0,
          };
        } else if (dir == 'top') {
          bnd.dir = 'bottom';
          bnd.orig = {
            x: orig.x,
            y: orig.y + orig.height,
            width: orig.width,
            height: 0,
          };
        } else if (dir == 'tr') {
          bnd.dir = 'bl';
          bnd.orig = {
            x: orig.x,
            y: orig.y + orig.height,
            width: 0,
            height: 0,
          };
        } else if (dir == 'right') {
          bnd.dir = 'left';
          bnd.orig = {
            x: orig.x,
            y: orig.y,
            width: 0,
            height: orig.height,
          };
        } else if (dir == 'br') {
          bnd.dir = 'tl';
          bnd.orig = {
            x: orig.x,
            y: orig.y,
            width: 0,
            height: 0,
          };
        } else if (dir == 'bottom') {
          bnd.dir = 'top';
          bnd.orig = {
            x: orig.x,
            y: orig.y,
            width: orig.width,
            height: 0,
          };
        } else if (dir == 'bl') {
          bnd.dir = 'tr';
          bnd.orig = {
            x: orig.x + orig.width,
            y: orig.y,
            width: 0,
            height: 0,
          };
        } else if (dir == 'left') {
          bnd.dir = 'right';
          bnd.orig = {
            x: orig.x + orig.width,
            y: orig.y,
            width: 0,
            height: orig.height,
          };
        }
        return;
      }

      d3.select(this)
        .attr('x', x -5)
        .attr('y', y -5)
      ;
      bnd.dest = dest;
      bnd.display(bnd.dest);
    };
  };

  var evtHandleDragStart = function(bnd, dir) {
    return function() {
      var bbox = bnd.selection.node().getBBox();
      console.log('start', bbox)
      bnd.orig = bnd.dest || bbox;
      bnd.selection
        .attr('vector-effect', 'non-scaling-stroke')
      ;
    };
  };

  var evtHandleDragEnd = function(bnd, dir) {
    return function() {
      bnd.dir = null;
      console.log('end')
    };
  };

  bnd.display = function(bbox) {
    var bnd = this;
    var bbox = bbox || this.selection.node().getBBox();
    var bb = this.getbb();
    if (!bb) {
      rect = this.container.append('rect')
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
            .on('start', evtHandleDragStart(bnd, 'tl'))
            .on('drag', evtHandleDrag(bnd, 'tl'))
            .on('end', evtHandleDragEnd(bnd, 'tl'))
        )
      ;
      var top = this.container.append('rect')
        .classed('bb-line top', true)
        .style('cursor', 'ns-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'top'))
            .on('drag', evtHandleDrag(bnd, 'top'))
            .on('end', evtHandleDragEnd(bnd, 'top'))
        )
      ;
      var tr = this.container.append('rect')
        .classed('bb-line tr', true)
        .style('cursor', 'nesw-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'tr'))
            .on('drag', evtHandleDrag(bnd, 'tr'))
            .on('end', evtHandleDragEnd(bnd, 'tr'))
        )
      ;
      var right = this.container.append('rect')
        .classed('bb-line right', true)
        .style('cursor', 'ew-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'right'))
            .on('drag', evtHandleDrag(bnd, 'right'))
            .on('end', evtHandleDragEnd(bnd, 'right'))
        )
      ;
      var br = this.container.append('rect')
        .classed('bb-line br', true)
        .style('cursor', 'nwse-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'br'))
            .on('drag', evtHandleDrag(bnd, 'br'))
            .on('end', evtHandleDragEnd(bnd, 'br'))
        )
      ;
      var bottom = this.container.append('rect')
        .classed('bb-line bottom', true)
        .style('cursor', 'ns-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'bottom'))
            .on('drag', evtHandleDrag(bnd, 'bottom'))
            .on('end', evtHandleDragEnd(bnd, 'bottom'))
        )
      ;
      var bl = this.container.append('rect')
        .classed('bb-line bl', true)
        .style('cursor', 'nesw-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'bl'))
            .on('drag', evtHandleDrag(bnd, 'bl'))
            .on('end', evtHandleDragEnd(bnd, 'bl'))
        )
      ;
      var left = this.container.append('rect')
        .classed('bb-line left', true)
        .style('cursor', 'ew-resize')
        .attr('vector-effect', 'non-scaling-stroke')
        .call(
          d3.drag()
            .on('start', evtHandleDragStart(bnd, 'left'))
            .on('drag', evtHandleDrag(bnd, 'left'))
            .on('end', evtHandleDragEnd(bnd, 'left'))
        )
      ;
      this.setbb(rect, tl, tr, br, bl, top, right, bottom, left);
    }
    bb = this.getbb();
    //console.log(bbox)
    bb.rect
      .attr('x', bbox.x)
      .attr('y', bbox.y)
      .attr('width', bbox.width)
      .attr('height', bbox.height)
    ;
    bb.tl
      .attr('x', bbox.x -5)
      .attr('y', bbox.y -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.top
      .attr('x', bbox.x + bbox.width/2 -5)
      .attr('y', bbox.y -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.tr
      .attr('x', bbox.x + bbox.width -5)
      .attr('y', bbox.y -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.right
      .attr('x', bbox.x + bbox.width -5)
      .attr('y', bbox.y + bbox.height/2 -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.br
      .attr('x', bbox.x + bbox.width -5)
      .attr('y', bbox.y + bbox.height -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.bottom
      .attr('x', bbox.x + bbox.width/2 -5)
      .attr('y', bbox.y + bbox.height -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.bl
      .attr('x', bbox.x -5)
      .attr('y', bbox.y + bbox.height -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
    bb.left
      .attr('x', bbox.x -5)
      .attr('y', bbox.y + bbox.height/2 -5)
      .attr('width', 10)
      .attr('height', 10)
    ;
  };

  return constructor; 
}])
;
