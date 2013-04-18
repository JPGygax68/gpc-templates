"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [], 
function() {

  //--- MAIN CLASS ---
  
  function Scanner(code) {
    //         >................<--- 1: leading whitespace + introducer
    //          ................   >............<--- 2: command
    //          ................    ............ >....<--- 3: parameters
    //          ................    ............  .... >..<--- terminator: "}}"
    //          ................    ............  ....  ..>...............................<--- 4: optional newline (or two)
    this.re = /(?:(^[ \t]*{{)|{{)\$(\b\w+\b|=|\-)([^}]*)}}((?:[ \t]*(?:\r\n|\r\n|\r|\n))?)?/gm;    
    this.code = code;
    this.last_pos = 0;
  }
  
  Scanner.prototype.scan = function() {
  
    // Find next tag
    if (this.curr_pos) this.re.lastIndex = this.curr_pos;
    this.last_pos = this.re.lastIndex;
    var m = this.re.exec(this.code);
    
    // Analyze and describe the match (if any)
    if (m) {
      var match = {
        start_of_line: !!m[1], 
        has_newline:   !!m[4],
        indent:        m[1] ? m[1].slice(0, m[1].length - 2) : '',
        line_breaks:   countLineBreaks(this.code, this.last_pos, m.index),
        command:       m[2], 
        params:        m[3].trim()
      };
      match.inline = isInlineCommand(match.cmd) || !match.has_newline;
      match.start  = m.index + (match.inline && m[1] ? (m[1].length - 2) : 0);
      
      // Advance past tag (but keep the newline if the tag was inline and there was one)
      this.curr_pos = this.re.lastIndex - ((match.inline && m[4]) ? m[4].length : 0);
    }
    else {
      this.curr_pos = this.code.length;
    }
    
    console.log(match);
    return match;
  }

  //--- Private routines ---
  
  function isInlineCommand(cmd) { return '=,list'.split(',').indexOf(cmd) >= 0; }
  
  function countLineBreaks(code, from, to) {
    var count = 0;
    for (var i = from; i < to; i++) {
      if      (code[i] === '\n') { count++; if (code[i+1] === '\r') i++; }
      else if (code[i] === '\r') { count++; if (code[i+1] === '\n') i++; }
    }
    return count;
  }
    
  //--- EXPORTS ---
  
  return Scanner;
});