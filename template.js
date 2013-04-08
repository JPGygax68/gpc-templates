"use strict";

/** Template system designed to generate C++ glue code.
 *  Promise'ified
 */
 
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [ 'q', 'q-io/fs', 'underscore', './structure', './text', './placeholder', './conditional', './repeater', './macro', './call', './jslist', './evaluator' ],
function(  Q ,       fs ,  _          ,    Structure ,    Text ,    Placeholder ,    Conditional ,    Repeater ,    Macro ,    Call ,    JSList ,    Evaluator  ) {

  //--- MAIN CLASS ---
  
  //             >................<--- 1: block/inline discrimination
  //              ................   >............<--- 2: command
  //              ................    ............ >....<--- 3: parameters
  //              ................    ............  .... >..<--- terminator: "}}"
  //              ................    ............  ....  ..>...............................<--- 4: optional newline (or two)
  var scanner = /(?:(^[ \t]*{{)|{{)\$(\b\w+\b|=|\-)([^}]*)}}((?:[ \t]*(?:\r\n?|\r\n?)){1,2})?/gm;
  
  function Template(code, filename) {

    this.code = code;
    
    var stack = [ new Structure() ];
    
    // Analyze the template, breaking it up into a tree
    var line_num = 1;
    var m;
    var pos = 0;
    while ((m = scanner.exec(code)) !== null) {
      // Inline if lacking a newline at the end
      var start_of_line = !!m[1], has_newline = !!m[4];
      var inline = (!start_of_line) || (!has_newline);
      for (var i = pos; i < m.index; i++) if (code[i] === '\n' || code[i] === '\r') { line_num ++; i ++; }
      //console.log('inline:', inline, 'beginning of line:', start_of_line, 'has newline:', has_newline, m[0]);
      var command = m[2], params = m[3].trim();
      // Text between last marked position and beginning of tag becomes new child (text) block
      addChild( new Text(pos, m.index + (inline && m[1] ? (m[1].length - 2) : 0) ) );
      // Tag type dependent actions
      if      (command === '='      ) { addChild( new Placeholder(params, filename, line_num) ); inline = true; }
      else if (command === 'if'     ) stack.push( addChild(new Conditional(params, filename, line_num)) );
      else if (command === 'foreach') stack.push( addChild(new Repeater   (params, filename, line_num)) );
      else if (command === 'forall' ) stack.push( addChild(new Repeater   (params, filename, line_num)) );
      else if (command === 'macro'  ) stack.push( addChild(new Macro      (params, filename, line_num)) );
      else if (command === 'elsif'  ) current().newBranch(params, filename, line_num);
      else if (command === 'else'   ) current().newBranch(params, filename, line_num);
      else if (command === 'end'    ) stack.pop();
      else if (command === 'list'   ) { addChild( new JSList(params, filename, line_num) ); inline = true; }
      else if (command === 'call'   ) addChild( new Call(params, filename, line_num) );
      else if (command[0] === '-'   ) ; // comment introducer, do nothing
      else                            throw new Error('Unrecognized template command "'+command+'"');
      // Advance past tag (but keep the newline if the tag was inline and there was one)
      pos = scanner.lastIndex - ((inline && m[4]) ? m[4].length : 0);
      for (var i = m.index; i < pos; i++) if (code[i] === '\n' || code[i] === '\r') { line_num ++; i ++; }
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
  }
  
  Template.registerFunction = Evaluator.registerFunction;
  
  Template.read = function(filename) {
    return fs.read(filename)
      .then( function(code) { return new Template(code, filename); } );
  }
  
  Template.prototype.exec = function(data, emit) {
    //console.log('context:');
    //console.log(context);
    
    return this.root_block.execute(data, this.code, emit || dbg_emit);
    
    function dbg_emit(text) { process.stdout.write(text); }
  }
  
  //--- PUBLIC INTERFACE ---
  
  return Template;
});