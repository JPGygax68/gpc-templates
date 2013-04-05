"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['q', './block'],
function( Q ,    Block ) {

  function Structure() { this.children = []; }

  Structure.prototype = new Block();
  Structure.prototype.constructor = Structure;

  Structure.prototype.execute = function(data, source, emitter) { 
    // This implementation can be used 1:1 by root block
    var seq = Q();
    this.children.forEach( function(child) { seq = seq.then( child.execute.bind(child, data, source, emitter) ); } );
    return seq;
  }
  
  return Structure;
});
