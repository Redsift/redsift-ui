/* global d3 */
'use strict';

var BezierEasing = require('../../node_modules/bezier-easing/dist/bezier-easing.js');

function circle(start, end, step, l, cx, cy, sx, sy) {
    if (cx === undefined) cx = 0;
    if (cy === undefined) cy = 0;
    if (sx === undefined) sx = 0;
    if (sy === undefined) sy = 0;

    var circle = [];
    for (var i=start; i<=end; i+=step) {
        var rad = (i / 360) * 2 * Math.PI - (Math.PI / 2);

        var sr = Math.sin(rad);
        var cr = Math.cos(rad);
        var x = l * cr + (sx * cr);
        var y = l * sr + (sy * sr);
        circle.push([x + cx, y + cy]);
    }
    return circle;
}

var Tools = {
  svgRoot: function (parent, width, height, classed) {
    var svg = d3.select(parent).append("svg")
          .attr("version", "1.1")
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .attr("width", width)
          .attr("height", height);

    if (classed != null) {
      svg.attr("class", classed);
    }

    // d3 work around
    svg.node().setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

    return svg;
  },
  redsiftDuration: function() {
    return 400;
  },
  redsiftEasing: function() {
    var f = this.redsiftBezier();
    return function(t) {
      return f.get(t);
    }
  },
  redsiftBezier: function() {
    return BezierEasing(0.175, 0.885, 0.335, 1.155);
  },
  preconnectTo: function(url) {
    // taken from https://www.igvita.com/2015/08/17/eliminating-roundtrips-with-preconnect/
    var hint = document.createElement("link");
    hint.rel = "preconnect";
    hint.href = url;
    document.head.appendChild(hint);
  },
  createCSSRuleSheet: function(media) {
    // Create the <style> tag
    var style = document.createElement("style");

    if (media) {
      style.setAttribute("media", media)
    }
    // style.setAttribute("media", "only screen and (max-width : 1024px)")

    // WebKit hack :(
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);
    var sheet = style.sheet;

    return function addCSSRule(selector, rules, index) {
      if("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index);
      }
      else if("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
      }
    }
  },
  createShadowFilter: function (defs, fname, morphRadius, shadowColour, blurRadius, padding) {
    if (morphRadius === undefined) {
      morphRadius = 1;
    }
    if (shadowColour === undefined) {
      shadowColour = 'rgba(230,230,230,0.6)';
    }

    if (blurRadius === undefined) {
      blurRadius = 1.1;
    }

    if (padding === undefined) {
      padding = "10px";
    }

    var filter = defs
      .append("filter")
      .attr("id", fname)
      .attr("x", "-" + padding)
      .attr("y", "-" + padding)
      .attr("width", "120")
      .attr("height", "120");

    filter.append("feMorphology")
      .attr('operator', 'dilate')
      .attr('radius', morphRadius)
      .attr('in', 'SourceAlpha')
      .attr('result', 'TEMPLATE');

    filter.append('feFlood')
      .attr('flood-color', shadowColour)
      .attr('result', 'COLOUR');

    filter.append('feComposite')
      .attr('in', "COLOUR")
      .attr('in2', "TEMPLATE")
      .attr('operator', "in")
      .attr('result', 'TEMPLATE_COLOUR');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', blurRadius)
      .attr('result', 'BG');

    var merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', "BG");
    merge.append('feMergeNode').attr('in', "SourceGraphic");
  },
  createDefs: function(parent) {
    if (parent === undefined) {
      parent = 'body';
    }
     var defs = d3.select(parent)
      .append("svg")
      .attr("style", "display: block; width: 0px; height: 0px;")
      .append("defs");

     return defs;
  },
  createMask: function(defs, id, fill) {
    var m = defs.append('mask')
            .attr('id', id);

    m.append('rect')
            .attr('x', -200)
            .attr('y', -200)
            .attr('width', 800)
            .attr('height', 800)
            .attr('fill', fill);

    return m;
  },
  createDiagonal: function(defs, id, ang, w, h, s) {
    if (ang == null) {
      ang = 45;
    } else if (typeof ang  === 'object') {
      s = ang.s;
      w = ang.w;
      h = ang.h;
      ang = ang.ang;
    }
    if (w === undefined) {
      w = 3;
    }
    if (h === undefined) {
      h = 3;
    }
    if (s === undefined) {
      s = 4;
    }
    var p = defs.append('pattern')
            .attr('id', id)
            .attr('width', s)
            .attr('height', s)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate('+ ang + ')');

    p.append('rect')
            .attr('class', 'background')
            .attr('width', s)
            .attr('height', s);

    p.append('rect')
            .attr('class', 'foreground')
            .attr('width', w)
            .attr('height', h)
            .attr('transform', 'translate(0,0)');

    return p;
  },
  createCircle: circle,
  arcLine: function() {

      var interpolation = null, degreeSteps = 1, outerRadius = 100;

      function impl(d) {
          var line = d3.svg.line();
          if (interpolation) {
              line = line.interpolate(interpolation);
          }

          var start = d.startAngle * 180 / Math.PI;
          var end = d.endAngle * 180 / Math.PI;
          var seg = circle(start, end, degreeSteps, outerRadius);
          return line(seg);
      }

      impl.interpolation = function(value) {
        if (!arguments.length) return interpolation;
        interpolation = value;
        return impl;
      }

      impl.degreeSteps = function(value) {
        if (!arguments.length) return degreeSteps;
        degreeSteps = value;
        return impl;
      }

      impl.outerRadius = function(value) {
        if (!arguments.length) return outerRadius;
        outerRadius = value;
        return impl;
      }

      return impl;
  },
  scalePattern: function(x, s) {
      if ((s == null) || (s === 1)) return x;

      return { ang: x.ang, w: x.w*s, h: x.h*s, s: x.s*s };
  }
};

if (typeof module !== 'undefined' && module.exports) { module.exports = Tools; } // CommonJs export
if (typeof define === 'function' && define.amd) { define([], function () { return Tools; }); } // AMD
