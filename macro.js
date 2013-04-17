"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['./structure'],
function(   Structure ) {

  function Macro(params, filename, linenum) {
    Structure.call(this, filename, linenum);
    var params = params.split(' ').map( function(el) { return el.trim(); } );
    // Register ourselves in the macro library
    this.name = params[0];
    Macro.lib[this.name] = this;
  }
  
  Macro.prototype = new Structure();
  Macro.prototype.constructor = Macro;
  
  Macro.lib = {};
  
  Macro.prototype.execute = function(data, source, emitter, go) {
    // A macro does nothing upon first "execution", must get "go" param from Call execution
    if (go) return Structure.prototype.execute.call(this, data, source, emitter);
  }
  
  return Macro;
});
