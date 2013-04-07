"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [],
function() {

  var context = {};
  
  // Prepend the "data" parameter to all identifiers except register functions
  
  function adaptExpression(expr) {
    // The following regex is not perfect, it cannot properly handle member
    // specifiers using square brackets instead of dots! (that would require nesting)
    //            >...............<--- catches strings
    //             ...............  >...............<--- catches strings (")
    //             ...............   ...............  >.....................<--- member specifier
    var pat = /(?:('(?:[^']|\\')*')|("(?:[^"]|\\")*")|(\b\w+\b(?:\.\b\w+\b)*))/gm, m;
    var result = '', p = 0;
    while ((m = pat.exec(expr)) !== null) {
      if (m[3]) {
        result += expr.slice(p, m.index);
        if      (isNumber(m[3])) ;
        else if (!context[m[3]]) result += 'data.'; 
        else                     result += 'context.';
        result += m[3];
        p = pat.lastIndex;
      }
    }
    if (p < expr.length) result += expr.slice(p);
    return result;
    
    function isNumber(s) { return parseFloat(s).toString() === s.toString(); }
  }
  
  function Evaluator(expr) {
    // Create an expression evaluator function
    var code = 'return (' + adaptExpression(expr) + ');';
    // Make injected context available without prefix
    /*
    var statements = _.map(context, function(elem, name) { return 'var '+name+' = context["'+name+'"];' } );
    statements.push(code);
    var code = statements.join('\n');
    */
    //console.log(code);
    return Function.call(this, 'data', 'context', code);
  }

  Evaluator.registerFunction = function(name, func) { context[name] = func; }  

  Evaluator.context = context;
  
  return Evaluator;
});
