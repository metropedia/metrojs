/* eslint-disable */
import * as d3 from "d3";
import * as helper from "./helpers";

export class MetroBBox {
  constructor(def) {
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

  getElements() {
    return this.elements;
  };

  setElements(area, tl, tr, br, bl, top, right, bottom, left) {
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

  setOrigin(bbox) {
    let obj = {};
    for (let p in bbox) {
      obj[p] = bbox[p];
    }
    this.orig = obj;
  };

  getOrigin() {
    return this.orig;
  };

  setLastEvent(xy) {
    this.pointerPos = xy;
  };

  getLastEvent() {
    return this.pointerPos;
  };

  setTransform(t) {
    this.transform = t;
  };

  getTransform() {
    return this.transform;
  };

  snap(n) {
    return helper.round(n, this.RESOLUTION);
  };

  on(evt, cb) {
    this.events[evt] = cb;
  };

  broadcast(evt, data) {
    this.events[evt].apply(this, [data]);
  };

  reset() {
    const transform = {
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

    const elements = this.getElements();
    if (elements) {
      for (let p in elements) {
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

  render() {
    const proto = this;
    const area = this.CONTAINER.append('rect')
      .style('fill', 'none')
      .classed('bb-line', true)
      .attr('vector-effect', 'non-scaling-stroke')
    ;
    const tl = this.CONTAINER.append('rect')
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
    const top = this.CONTAINER.append('rect')
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
    const tr = this.CONTAINER.append('rect')
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
    const right = this.CONTAINER.append('rect')
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
    const br = this.CONTAINER.append('rect')
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
    const bottom = this.CONTAINER.append('rect')
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
    const bl = this.CONTAINER.append('rect')
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
    const left = this.CONTAINER.append('rect')
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

  listen() {
    const elements = this.getElements();
    if (!elements) {
      this.render();
    }

    this.setOrigin(
      this.SELECTION.attr('vector-effect', 'non-scaling-stroke').node().getBBox()
    );

    this.update();
  };

  reload() {
    this.listen();
  };

  update(dest) {
    const el = this.getElements(),
        orig = this.getOrigin(),
           b = dest || orig
    ;

    let handle = [
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

    let sorted = JSON.parse(JSON.stringify(handle));
    const areas = sorted.map(function(h){
      return Math.abs(h.value.x * h.value.y);
    });

    // calculate area size in order to find upper left corner
    const min = areas.indexOf(Math.min.apply(Math, areas));
    const max = areas.indexOf(Math.max.apply(Math, areas));
    //console.log(min, sorted[min].name, max, sorted[max].name);

    sorted = [].concat(
      sorted.slice(min, sorted.length)
    ).concat(
      sorted.slice(0, min)
    );

    let swap;
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
    let temp = {};
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
      const scaleX = dest.width/orig.width || 0.000001;
      const scaleY = dest.height/orig.height || 0.000001;
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
};

const evtHandleDrag = function(proto, dir) {
  return function() {
    const x = proto.snap(d3.event.x);
    const y = proto.snap(d3.event.y);
    const pointerPos = proto.getLastEvent();
    let dest;
    const orig = proto.getOrigin();

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

    const transform = proto.update(dest);

    proto.SELECTION
      .attr('transform', ''
       +'translate(' + transform.translateX + ', ' + transform.translateY + ')'
       +'scale(' + transform.scaleX + ', ' + transform.scaleY + ')'
      )
    ;

    proto.setTransform(transform);
  };
};

const evtHandleDragStart = function(proto, dir) {
  return function() {
    //console.log('start')
  };
};

const evtHandleDragEnd = function(proto, dir) {
  return function() {
    // Must transform scaled and translated shape back into original
    // and remove attributes translate and scale
    const transform = proto.getTransform();
    if (!transform) return;
    //console.log(transform)
    //console.log(proto.SELECTION.attr('d'))
    const pathString = helper.transformPathString(proto.SELECTION.attr('d'), transform);
    helper.drawGuide(proto.SELECTION, pathString);
    //console.log(pathString)

    proto.broadcast('resized', transform);
    proto.reset();
    //console.log('end')
  };
};
