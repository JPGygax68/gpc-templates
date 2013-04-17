"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['Q', './block', './macro'],
function( Q ,    Block ,    Macro ) {

  function Call(params, filename, linenum, indent) {
    var params = params.split(' ').map( function(el) { return el.trim(); } );
    this.macro = params[0];
    this.indent = indent;
    console.log('Call indent: "'+this.indent+'"');
  }
  
  Call.prototype = new Block();
  Call.prototype.constructor = Call;
  
  Call.prototype.execute = function(data, source, emitter) {
    // Look up the macro in the library
    if (!(this.macro instanceof Macro)) this.macro = Macro.lib[this.macro];
    // Execute the called macro
    var self = this;
    return Q.resolve()
      .then( function() { if (self.indent !== false) emitter.addIndent(self.indent); } )
      .then( function() { return self.macro.execute(data, source, emitter, true); } )
      .then( function() { if (self.indent !== false) emitter.popIndent(); } );
  }
  
  return Call;
});
