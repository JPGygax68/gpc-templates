"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['q', './structure', './evaluator'],
function( Q ,    Structure ,    Evaluator ) {

  function Conditional(condition) {
    Structure.call(this);
    this.branches = [];
    this.newBranch(condition);
  }
  
  Conditional.prototype = new Structure();
  Conditional.prototype.constructor = Conditional;
  
  Conditional.prototype.newBranch = function(condition, filename, line_num) {
    // TODO: check for proper sequence if .. elsif .. else
    if (condition.length > 0) {
      var condEval = new Evaluator(condition, filename, line_num);
    }
    else {
      var condEval = new Function('return true;');
    }
    this.branches.push( {condEval: condEval, first_block: this.children.length } );
  }
  
  Conditional.prototype.execute = function(data, source, emitter) {
    var seq = Q();
    for (var i = 0; i < this.branches.length; i++) {
      var branch = this.branches[i];
      //console.log('Data for Conditional:', data);
      if (branch.condEval(data, Evaluator.context)) {
        var to_block = i < (this.branches.length-1) ? this.branches[i+1].first_block : this.children.length;
        for (var j = branch.first_block; j < to_block; j++) {
          var block = this.children[j];
          seq = seq.then( block.execute.bind(block, data, source, emitter) );
        }
        break; // first if / elsif wins, rest are not considered
      }
    }
    return seq;
  }
  
  return Conditional;
});
