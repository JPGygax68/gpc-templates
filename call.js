"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['./block', './macro'],
function(   Block ,    Macro ) {

  function Call(params) {
    var params = params.split(' ').map( function(el) { return el.trim(); } );
    this.macro = params[0];
  }
  
  Call.prototype = new Block();
  Call.prototype.constructor = Call;
  
  Call.prototype.execute = function(data, source, emitter) {
    // Look up the macro in the library
    if (!(this.macro instanceof Macro)) this.macro = Macro.lib[this.macro];
    // Execute the called macro
    return this.macro.execute(data, source, emitter, true);
  }
  
  return Call;
});
