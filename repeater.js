"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['q', 'underscore', './structure'],
function( Q ,  _          ,    Structure ) {

  function Repeater(set) {
    Structure.call(this);
    this.set = set; // TODO: parse
  }
  
  Repeater.prototype = new Structure();
  Repeater.prototype.constructor = Repeater;
  
  Repeater.prototype.execute = function(data, source, emitter) {
    this.set.split('.').forEach( function(key) { data = data[key]; } );
    //console.log('Repeater outer data:', data);
    var seq = Q();
    _.each(data, function(data_item, key) { 
      //console.log('Repeater inner data:', data_item, '(key = '+key+')');
      seq = seq.delay(1).then( Structure.prototype.execute.bind(this, data_item, source, emitter) );
    }, this);
    return seq;
  }
  
  return Repeater;
  
});
