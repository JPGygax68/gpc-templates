"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['underscore', './structure', './evaluator'],
function( _          ,    Structure ,    Evaluator ) {

  function JSList(params) {
    var params = params.split(' ').map( function(el) { return el.trim(); } );
    if (params.length < 1) throw new Error('List element needs at minimum the name of the list, and optionally the name of an element member');
    this.list = params[0];
    if (params.length > 1) this.memberEval = new Evaluator(params[1]);
  }
  
  JSList.prototype = new Structure();
  JSList.prototype.constructor = JSList;
  
  JSList.prototype.execute = function(data, source, emitter) { 
    var list = this.memberEval 
      ? _.map( data[this.list], function(el) { return this.memberEval(el, Evaluator.context); }, this )
      : data[this.list];
    return emitter( list.join(', ') );
  }
    
  return JSList;
});
