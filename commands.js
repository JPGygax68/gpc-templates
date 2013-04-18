"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['underscore', './structure', './text', './placeholder', './conditional', './repeater', './macro', './call', './jslist'], 
function( _          ,    Structure ,    Text ,    Placeholder,     Conditional ,    Repeater ,    Macro,    Call  ,    JSList) {

  var TYPES = {
    STANDALONE   : 1,
    BLOCK_START  : 2,
    BLOCK_DIVIDER: 3,
    BLOCK_END    : 4
  };
  
  return _.extend( {
    Structure:    Structure,
    Text:         Text,
    Placeholder:  Placeholder, 
    Conditional:  Conditional, 
    Repeater:     Repeater,
    Macro:        Macro,
    Call:         Call,
    JSList:       JSList,
    
    TAGS: {
      '='      : { ctor: Placeholder, type: TYPES.STANDALONE   , nesting:  0},
      'if'     : { ctor: Conditional, type: TYPES.BLOCK_START  , nesting:  1},
      'foreach': { ctor: Repeater   , type: TYPES.BLOCK_START  , nesting:  1},
      'forall' : { ctor: Repeater   , type: TYPES.BLOCK_START  , nesting:  1},
      'macro'  : { ctor: Macro      , type: TYPES.BLOCK_START  , nesting:  1},
      'list'   : { ctor: JSList     , type: TYPES.STANDALONE   , nesting:  0},
      'call'   : { ctor: Call       , type: TYPES.STANDALONE   , nesting:  0},
      'elsif'  : { ctor: null       , type: TYPES.BLOCK_DIVIDER, nesting:  0},
      'else'   : { ctor: null       , type: TYPES.BLOCK_DIVIDER, nesting:  0},
      'end'    : { ctor: null       , type: TYPES.BLOCK_END    , nesting: -1}
    },
    
  }, TYPES );
  
});