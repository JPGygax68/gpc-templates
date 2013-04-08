"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['./block', './evaluator'],
function(   Block ,    Evaluator ) {

  function Placeholder(expr, filename, line_num) {
    this.expr = expr;
    this.exprEval = new Evaluator(expr, filename, line_num);
  }
  
  Placeholder.prototype = new Block();
  Placeholder.prototype.constructor = Placeholder;
  
  Placeholder.prototype.execute = function(data, source, emitter) { 
    //console.log('Placeholder data:', data);
    var value = this.exprEval(data, Evaluator.context);
    if (typeof value === 'undefined') throw new Error('Cannot evaluate expression "'+this.expr+'"');
    return emitter(value.toString() );
  }
  
  return Placeholder;
});
