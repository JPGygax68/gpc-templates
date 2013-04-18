"use strict";

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( ['./commands'], 
function(   Commands ) {

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
    if (typeof this.curr_pos !== 'undefined') this.re.lastIndex = this.curr_pos;
    this.last_pos = this.re.lastIndex;
    var m = this.re.exec(this.code);
    
    // Analyze and describe the match (if any)
    if (m) {
      var match = {
        start_of_line: !!m[1], 
        has_newline:   !!m[4],
        indent:        m[1] ? m[1].slice(0, m[1].length - 2) : '',
        command:       m[2], 
        params:        m[3].trim()
      };
      match.inline = isInlineCommand(match.cmd) || !match.has_newline;
      match.start  = m.index + (match.inline && m[1] ? (m[1].length - 2) : 0);
      
      // Advance past tag (but keep the newline if the tag was inline and there was one)
      //this.curr_pos = this.re.lastIndex - (m[4] ? m[4].length : 0);
      this.curr_pos = this.re.lastIndex - ((match.inline && m[4]) ? m[4].length : 0);
    }
    else {
      this.curr_pos = this.code.length;
    }
    
    //console.log(match);
    return match;
  }

  Scanner.prototype.sniffIndent = function() {
  
    var saved = { last_pos: this.last_pos, curr_pos: this.curr_pos };
    
    var level = 1, m;
    while (level > 0 && (m = this.scan())) {
      //console.log(m.command);
      var cmd = Commands.TAGS[m.command];
      if (cmd) {
        if      (cmd.type === Commands.BLOCK_START  ) level ++;
        else if (cmd.type === Commands.BLOCK_DIVIDER) ;
        else if (cmd.type === Commands.BLOCK_END    ) level --;
      }
    }
    
    var text = this.code.slice(saved.curr_pos, m.start);
    var indent = '                                             ';
    //var lines = text.split(/\n\r|\r\n|\n|\r/);
    var re = /(^[ \t]*)([^ \t])/gm, m;
    while ((m = re.exec(text))) { if (m && m[1] && m[1].length < indent.length) indent = m[1]; }    
    
    this.last_pos = saved.last_pos;
    this.curr_pos = saved.curr_pos;
    
    //console.log('sniffIndent => "'+indent+'", length =', indent.length);
    
    return indent;
  }
  
  //--- Private routines ---
  
  function isInlineCommand(cmd) { return '=,list'.split(',').indexOf(cmd) >= 0; }
  
  //--- EXPORTS ---
  
  return Scanner;
});