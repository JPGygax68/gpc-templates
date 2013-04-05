"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [],
function() {

  function Block() {}
  
  Block.prototype.execute = function(data, source, emitter) { throw new Error('Block.execute() method must be overridden'); }

  return Block;
});
