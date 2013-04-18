"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['./structure', './text', './placeholder', './conditional', './repeater', './macro', './call', './jslist'], 
function(   Structure ,    Text ,    Placeholder,     Conditional ,    Repeater ,    Macro,    Call  ,    JSList) {

  return {
    Structure:    Structure,
    Text:         Text,
    Placeholder:  Placeholder, 
    Conditional:  Conditional, 
    Repeater:     Repeater,
    Macro:        Macro,
    Call:         Call,
    JSList:       JSList
  };
  
});