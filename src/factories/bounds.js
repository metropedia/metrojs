angular.module('metro')

.factory('Bounds', [function() {
  function constructor(def) {
    this.selection = def.selection;
    this.container = def.container;
    this.rect = null;
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

  bnd.display = function() {
    var bbox = this.selection.node().getBBox();
    var bb = this.getbb();
    if (!bb) {
      rect = this.container.append('rect')
        .style('fill', 'none')
        .classed('bb-line', true)
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var tl = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'nwse-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var tr = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'nesw-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var br = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'nesw-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var bl = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'nwse-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var top = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'ns-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var right = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'ew-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var bottom = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'ns-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      var left = this.container.append('rect')
        .classed('bb-line', true)
        .style('cursor', 'ew-resize')
        .attr('vector-effect', 'non-scaling-stroke')
      ;
      this.setbb(rect, tl, tr, br, bl, top, right, bottom, left);
    }
    bb = this.getbb();
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
