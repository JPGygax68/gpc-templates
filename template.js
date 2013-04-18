"use strict";

/** Template system designed to generate C++ glue code.
 *  Promise'ified
 */
 
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [ 'q', 'q-io/fs', 'underscore', './structure', './text', './placeholder', './conditional', 
          './repeater', './macro', './call', './jslist', './evaluator', './scanner' ],
function( Q, fs ,  _, Structure, Text, Placeholder, Conditional, 
          Repeater, Macro, Call, JSList, Evaluator, Scanner ) {

  //--- MAIN CLASS ---
  
  function Template(code, filename) {

    this.code = code;
    
    var stack = [ new Structure() ];
    
    // Analyze the template, breaking it up into a tree
    var scanner = new Scanner(code);
    var line_num = 1;
    var m;
    while ((m = scanner.scan())) {
      line_num += m.line_breaks;
      // Span between last position and beginning of tag (with or without leading whitespace)
      addText(scanner.last_pos, m.start);
      // Tag type dependent actions
      if      (m.command === '='      ) addCommand(Placeholder);
      else if (m.command === 'if'     ) addBlock  (Conditional);
      else if (m.command === 'foreach') addBlock  (Repeater   );
      else if (m.command === 'forall' ) addBlock  (Repeater   );
      else if (m.command === 'macro'  ) addBlock  (Macro      );
      else if (m.command === 'elsif'  ) addBranch ()
      else if (m.command === 'else'   ) addBranch ();
      else if (m.command === 'end'    ) stack.pop();
      else if (m.command === 'list'   ) addCommand(JSList     );
      else if (m.command === 'call'   ) addCommand(Call       );
      else if (m.command[0] === '-'   ) ; // comment introducer, do nothing
      else                            throw new Error('Unrecognized template command "'+command+'"');
      // If this wasn't an inline tag, increment line number
      if (!m.inline) line_num ++;
    }
    // Add last block of text
    addText(scanner.last_pos, scanner.curr_pos);
    
    // Done!
    if (stack.length !== 1) throw new Error('Opening/closing tag inbalance: closing depth at '+stack.length+' instead of 1');
    this.root_block = stack[0];

    //---
    
    function current()         { if (stack.length < 1) throw new Error('Block nesting error: too many $end\'s'); return stack[stack.length-1]; }
    function makeCommand(ctor) { console.log(ctor);return new ctor(m.params, filename, line_num, !m.inline ? m.indent : false); }
    function addCommand(ctor)  { var cmd = makeCommand(ctor); current().children.push(cmd); return cmd; }
    function addBlock(ctor)    { stack.push( addCommand(ctor) ); }
    function addBranch()       { current().newBranch(m.params, filename, line_num); }
    function addText(from, to) { current().children.push( new Text(from, to) ); }
        
    function sniffIndent() {
      var last_index_save = scanner.lastIndex;
      var level = 1;
      while (level > 0) {
        var m = scanner.exec(code);
      }
      scanner.lastIndex = lastIndexSave;
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