"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['./block'],
function(   Block ) {

  function Text(start, end) {  
    this.start = start; this.end = end;
  }

  Text.prototype = new Block();
  Text.prototype.constructor = Text;

  Text.prototype.execute = function(data, source, emitter) { return emitter(source.slice(this.start, this.end)); }
  
  return Text;
});
