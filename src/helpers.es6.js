export function round(p, n) {
  return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
};

export function drawGuide (container, pathString) {
  return container
    .attr('d', pathString)
  ;
};

export function transformPathString (pathString, transform) {
  return pathString
    .replace(/([a-z])/ig, '|$1|')
    .split('|')
    .map(function(str) {
      var pt = str.split(',')
      if (pt.length >= 2) {
        pt[0] = pt[0] * transform.scaleX + transform.translateX;
        pt[1] = pt[1] * transform.scaleY + transform.translateY;
        if (pt[2]) pt[2] = pt[2] * transform.scaleX + transform.translateX;
        if (pt[3]) pt[3] = pt[3] * transform.scaleY + transform.translateY;
        return pt.join(',');
      } else {
        return str;
      }
    })
    .join('')
  ;
};

export function drawStation (container, station, def) {
  return container.append('rect')
    .attr('station-id', station.id)
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('x', helper.round(.5 * def.width, def.resolution))
    .attr('y', helper.round(.5 * def.height, def.resolution))
    .attr('width', 22)
    .attr('height', 22)
    .attr('transform', 'translate(-11, -11)')
    .attr('stroke-width', 2)
    .classed('svg-station', true)
  ;
};

export function drawPointer (container, def) {
  return container.selectAll()
    .data([{
      x: round(.5 * def.width, def.resolution),
      y: round(.5 * def.height, def.resolution)
    }])
    .enter()
    .append('circle')
      .attr('class', 'pointer')
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', def.pointerRadius)
  ;
};

export function drawShade (container, def) {
  return container.selectAll()
    .data([{x: -999, y: -999 }])
    .enter()
    .append('circle')
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', def.pointerRadius)
  ;
};

export function drawGridlines (container, def) {
  container.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', def.width)
    .attr('height', def.height)
    .attr('fill', 'white')
  ;

  container.selectAll()
    .data(d3.range(0, def.width / def.resolution +1))
    .enter()
    .append('line')
      .attr('class', 'vertical')
      .attr('x1', function(d) { return d * def.resolution; })
      .attr('y1', 0)
      .attr('x2', function(d) { return d * def.resolution; })
      .attr('y2', def.height)
      .attr('vector-effect', 'non-scaling-stroke')
  ;
  
  container.selectAll()
    .data(d3.range(0, def.height / def.resolution +1))
    .enter()
    .append('line')
      .attr('class', 'horizontal')
      .attr('x1', 0)
      .attr('y1', function(d) { return d * def.resolution; })
      .attr('x2', def.width)
      .attr('y2', function(d) { return d * def.resolution; })
      .attr('vector-effect', 'non-scaling-stroke')
  ;
};

export function drawSplashMask (container, def) {
  container.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', def.width)
    .attr('height', def.height)
    .attr('fill', 'black')
    .attr('opacity', .8)
  ;
};

export function drawSplashButton (container, def) {
  return container.append('rect')
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('x', round(.5 * def.width, def.resolution))
    .attr('y', round(.5 * def.height, def.resolution))
    .attr('width', 150)
    .attr('height', 46)
    .attr('transform', 'translate(-75, -23)')
    .attr('stroke-width', 2)
    .attr('fill', 'white')
    .attr('cursor', 'pointer')
  ;
};

export function drawSplashButtonText (container, def) {
  var text = container.append('text')
    .attr('x', round(.5 * def.width, def.resolution))
    .attr('y', round(.5 * def.height, def.resolution))
    .attr('width', 150)
    .attr('transform', 'translate(0, 7)')
    .attr('fill', 'black')
    .attr('cursor', 'pointer')
    .attr('font-size', '22px')
  ;
  text.append('tspan')
    .attr('text-anchor', 'middle')
    .text('New Metro')
  ;
  return text;
};

export function drawCanvas (container, def) {
  return container.append('svg')
    .attr('width', def.width)
    .attr('height', def.height)
  ;
};

