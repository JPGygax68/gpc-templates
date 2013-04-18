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
      '='      : { ctor: Placeholder, type: TYPES.STANDALONE   },
      'if'     : { ctor: Conditional, type: TYPES.BLOCK_START  },
      'foreach': { ctor: Repeater   , type: TYPES.BLOCK_START  },
      'forall' : { ctor: Repeater   , type: TYPES.BLOCK_START  },
      'macro'  : { ctor: Macro      , type: TYPES.BLOCK_START  },
      'list'   : { ctor: JSList     , type: TYPES.STANDALONE   },
      'call'   : { ctor: Call       , type: TYPES.STANDALONE   },
      'elsif'  : { ctor: null       , type: TYPES.BLOCK_DIVIDER},
      'else'   : { ctor: null       , type: TYPES.BLOCK_DIVIDER},
      'end'    : { ctor: null       , type: TYPES.BLOCK_END    }
    },
    
  }, TYPES );
  
});