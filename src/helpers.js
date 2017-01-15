angular.module('metro')

.factory('metroHelper', [function() {

  var helper = this;

  helper.drawGuide = (container, pathString) => {
    return container
      .attr('d', pathString)
      .attr('fill', 'none')
      .attr('display', 'none')
    ;
  };

  helper.drawStation = (container, station, def) => {
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

  helper.drawPointer = (container, def) => {
    return container.selectAll()
      .data([{
        x: helper.round(.5 * def.width, def.resolution),
        y: helper.round(.5 * def.height, def.resolution)
      }])
      .enter()
      .append('circle')
        .attr('class', 'pointer')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', def.pointerRadius)
    ;
  };

  helper.drawShade = (container, def) => {
    return container.selectAll()
      .data([{x: -999, y: -999 }])
      .enter()
      .append('circle')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', def.pointerRadius)
    ;
  };

  helper.drawGridlines = (container, def) => {
    container.selectAll()
      .data(d3.range(1, def.width / def.resolution))
      .enter()
      .append('line')
        .attr('class', 'vertical')
        .attr('x1', function(d) { return d * def.resolution; })
        .attr('y1', 0)
        .attr('x2', function(d) { return d * def.resolution; })
        .attr('y2', def.height)
    ;
    
    container.selectAll()
      .data(d3.range(1, def.height / def.resolution))
      .enter()
      .append('line')
        .attr('class', 'horizontal')
        .attr('x1', 0)
        .attr('y1', function(d) { return d * def.resolution; })
        .attr('x2', def.width)
        .attr('y2', function(d) { return d * def.resolution; })
    ;
  };

  helper.drawSplashMask = (container, def) => {
    container.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', def.width)
      .attr('height', def.height)
      .attr('fill', 'black')
      .attr('opacity', .8)
    ;
  };

  helper.drawSplashButton = (container, def) => {
    return container.append('rect')
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('x', helper.round(.5 * def.width, def.resolution))
      .attr('y', helper.round(.5 * def.height, def.resolution))
      .attr('width', 150)
      .attr('height', 46)
      .attr('transform', 'translate(-75, -23)')
      .attr('stroke-width', 2)
      .attr('fill', 'white')
      .attr('cursor', 'pointer')
    ;
  };

  helper.drawSplashButtonText = (container, def) => {
    var text = container.append('text')
      .attr('x', helper.round(.5 * def.width, def.resolution))
      .attr('y', helper.round(.5 * def.height, def.resolution))
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

  helper.drawCanvas = (container, def) => {
    return container.append('svg')
      .attr('width', def.width)
      .attr('height', def.height)
    ;
  };

  helper.round = (p, n) => p % n < n / 2 ? p - (p % n) : p + n - (p % n);

  return helper;
}]);
