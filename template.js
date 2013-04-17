"use strict";

/** Template system designed to generate C++ glue code.
 *  Promise'ified
 */
 
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [ 'q', 'q-io/fs', 'underscore', './structure', './text', './placeholder', './conditional', './repeater', './macro', './call', './jslist', './evaluator' ],
function(  Q ,       fs ,  _          ,    Structure ,    Text ,    Placeholder ,    Conditional ,    Repeater ,    Macro ,    Call ,    JSList ,    Evaluator  ) {

  //--- MAIN CLASS ---
  
  //             >................<--- 1: leading whitespace + introducer
  //              ................   >............<--- 2: command
  //              ................    ............ >....<--- 3: parameters
  //              ................    ............  .... >..<--- terminator: "}}"
  //              ................    ............  ....  ..>...............................<--- 4: optional newline (or two)
  var scanner = /(?:(^[ \t]*{{)|{{)\$(\b\w+\b|=|\-)([^}]*)}}((?:[ \t]*(?:\r\n|\r\n|\r|\n))?)?/gm;
  
  function Template(code, filename) {

    this.code = code;
    
    var stack = [ new Structure() ];
    
    // Analyze the template, breaking it up into a tree
    var line_num = 1;
    var m;
    var pos = 0, p2;
    while ((m = scanner.exec(code)) !== null) {
      // Check whether it's an inline tag, obtain indent
      var start_of_line = !!m[1], has_newline = !!m[4];
      var indent = m[1] ? m[1].slice(0, m[1].length - 2) : '';
      var inline = !has_newline; // (!start_of_line) || (!has_newline);
      // Count line breaks end of last tag
      countLineBreaks(pos, m.index);
      // Extract command, parameters
      var command = m[2], params = m[3].trim();
      // Span between last position and beginning of tag (with or without leading whitespace)
      p2 = m.index + (inline && m[1] ? (m[1].length - 2) : 0);
      addChild( new Text(pos, p2) );
      // Tag type dependent actions
      if      (command === '='      ) { addChild( new Placeholder(params, filename, line_num) ); inline = true; }
      else if (command === 'if'     ) stack.push( addChild(new Conditional(params, filename, line_num)) );
      else if (command === 'foreach') stack.push( addChild(new Repeater   (params, filename, line_num)) );
      else if (command === 'forall' ) stack.push( addChild(new Repeater   (params, filename, line_num)) );
      else if (command === 'macro'  ) stack.push( addChild(new Macro      (params, filename, line_num)) ); // TODO: "sniff" macro indent
      else if (command === 'elsif'  ) current().newBranch(params, filename, line_num);
      else if (command === 'else'   ) current().newBranch(params, filename, line_num);
      else if (command === 'end'    ) stack.pop();
      else if (command === 'list'   ) { addChild( new JSList(params, filename, line_num) ); inline = true; }
      else if (command === 'call'   ) addChild( new Call(params, filename, line_num, !inline ? indent : false) );
      else if (command[0] === '-'   ) ; // comment introducer, do nothing
      else                            throw new Error('Unrecognized template command "'+command+'"');
      // Advance past tag (but keep the newline if the tag was inline and there was one)
      pos = scanner.lastIndex - ((inline && m[4]) ? m[4].length : 0);
      countLineBreaks(m.index, pos);
      //console.log(pos);
    }
    // Add last block of text
    addChild( new Text(pos, code.length) );
    
    // Done!
    if (stack.length !== 1) throw new Error('Opening/closing tag inbalance: closing depth at '+stack.length+' instead of 1');
    this.root_block = stack[0];
    //console.log( JSON.stringify(stack[0], null, "    ") );

    //---
    function current()       { if (stack.length < 1) throw new Error('Block nesting error: too many $end\'s'); return stack[stack.length-1]; }
    function addChild(child) { current().children.push(child); return child; }
    
    function countLineBreaks(from, to) {
      for (var i = pos; i < m.index; i++) 
        if      (code[i] === '\n') { line_num++; if (code[i+1] === '\r') i++; }
        else if (code[i] === '\r') { line_num++; if (code[i+1] === '\n') i++; }
    }
  }
  
  Template.registerFunction = Evaluator.registerFunction;
  
  Template.read = function(filename) {
    return fs.read(filename)
      .then( function(code) { return new Template(code, filename); } );
  }
  
  Template.prototype.exec = function(data, emit) {
    //console.log('context:');
    //console.log(context);
    
    var indents = [], full_indent = '';
    var linebuf = '', last_line_empty = false;
    
    var emitter = function(text ) { 
      var lines = text.split(/\n\r|\r\n|\n|\r/);
      for (var i = 0; i < (lines.length-1); i ++) { linebuf += lines[i]; flushLineBuffer(); }
      linebuf += lines[i];
    };
    emitter.addIndent = function(indent) { indents.push(indent); full_indent = indents.join(''); };
    emitter.popIndent = function()       { indents.pop()       ; full_indent = indents.join(''); };
    
    return this.root_block.execute(data, this.code, emitter) .then( flushLineBuffer );
    
    function flushLineBuffer() { 
      if (linebuf.trim() === '') { if (!last_line_empty) { last_line_empty = true; emit('\n'); } }
      else                       { last_line_empty = false; emit(full_indent + linebuf + '\n'); }
      linebuf = ''; 
    }
    
    function dbg_emit(text) { process.stdout.write(text); }
  }
  
  //--- PUBLIC INTERFACE ---
  
  return Template;
});