"use strict";

/** Template system designed to generate C++ glue code.
 *  Promise'ified
 */
 
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define( [ 'q', 'q-io/fs', 'underscore', './commands', './evaluator', './scanner' ],
function(  Q ,       fs ,  _          ,    Commands ,    Evaluator ,    Scanner  ) {

  //--- MAIN CLASS ---
  
  function Template(code, filename) {

    this.code = code;
    
    var stack = [ new Commands.Structure() ];
    
    // Analyze the template, breaking it up into a tree
    var scanner = new Scanner(code);
    var line_num = 1;
    var m;
    current().outdent = '';
    while ((m = scanner.scan())) {
      line_num += countLineBreaks(scanner.last_pos, m.start);
      // Span between last position and beginning of tag (with or without leading whitespace)
      addText(scanner.last_pos, m.start);
      // Tag type dependent actions
      if      (m.command === '='      ) addCommand(Commands.Placeholder); 
      else if (m.command === 'if'     ) beginBlock(Commands.Conditional);
      else if (m.command === 'foreach') beginBlock(Commands.Repeater   );
      else if (m.command === 'forall' ) beginBlock(Commands.Repeater   );
      else if (m.command === 'list'   ) addCommand(Commands.JSList     );
      else if (m.command === 'call'   ) addCommand(Commands.Call       );
      else if (m.command === 'macro'  ) beginMacro();
      else if (m.command === 'elsif'  ) addBranch ();
      else if (m.command === 'else'   ) addBranch ();
      else if (m.command === 'end'    ) closeBlock();
      else if (m.command[0] === '-'   ) ; // comment introducer, do nothing
      else                              throw new Error('Unrecognized template command "'+command+'"');
      // If this wasn't an inline tag, increment line number
      if (!m.inline) line_num ++;
    }
    // Add last block of text
    addText(scanner.last_pos, scanner.curr_pos);
    line_num += countLineBreaks(scanner.last_pos, scanner.curr_pos);
    console.log('Ending at line number ' + line_num);
    
    // Done!
    if (stack.length !== 1) throw new Error('Opening/closing tag inbalance: closing depth at '+stack.length+' instead of 1');
    this.root_block = stack[0];

    //---
    
    function current()                 { checkStack(); return stack[stack.length-1]; }
                                       
    function makeCommand(ctor)         { return new ctor(m.params, filename, line_num, !m.inline ? m.indent : false); }
    function addCommand(ctor)          { var cmd = makeCommand(ctor); current().children.push(cmd); return cmd; }
    function beginBlock(ctor, outdent) { var cmd = addCommand(ctor); cmd.outdent = outdent; stack.push(cmd); return cmd; }
    function addBranch()               { current().newBranch(m.params, filename, line_num); }
    function addText(from, to)         { current().children.push( new Commands.Text(from, to) ); }
    function beginMacro()              { beginBlock(Commands.Macro, scanner.sniffIndent());  }
    function closeBlock()              { stack.pop(); }

    function checkStack()              { if (stack.length < 1) throw new Error('Block nesting error: too many $end\'s'); }
        
    function countLineBreaks(from, to) {
      var count = 0;
      for (var i = from; i < to; i++) {
        if      (code[i] === '\n') { count++; if (code[i+1] === '\r') i++; }
        else if (code[i] === '\r') { count++; if (code[i+1] === '\n') i++; }
      }
      return count;
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
    
    var indents  = [], full_indent  = '';
    var outdents = [], full_outdent = '';
    var linebuf = '', last_line_empty = false;
    
    var emitter = function(text ) { 
      var lines = text.split(/\n\r|\r\n|\n|\r/);
      for (var i = 0; i < lines.length; i ++) { 
        var line = lines[i];
        linebuf += line; 
        if (i < (lines.length-1)) flushLineBuffer(); 
      }
    };
    
    emitter.addIndent  = function(indent ) { indents .push(indent) ; full_indent  = indents .join(''); }
    emitter.popIndent  = function()        { indents .pop ()       ; full_indent  = indents .join(''); }
    emitter.addOutdent = function(outdent) { outdents.push(outdent); full_outdent = outdents.join(''); }
    emitter.popOutdent = function()        { outdents.pop()        ; full_outdent = outdents.join(''); }
    
    return this.root_block.execute(data, this.code, emitter) .then( flushLineBuffer );
    
    function flushLineBuffer() { 
      if (linebuf.trim() === '') { if (!last_line_empty) { last_line_empty = true; emit('\n'); } }
      else { 
        last_line_empty = false; 
        linebuf = full_indent + linebuf;
        //console.log('"'+linebuf+'", outdent="'+full_outdent+'"');
        if (full_outdent.length > 0) {
          if (linebuf.slice(0, full_outdent.length) === full_outdent) {
            //console.log('outdenting "'+full_outdent+'"');
            linebuf = linebuf.slice(full_outdent.length);
          }
        }
        emit(linebuf + '\n'); 
      }
      linebuf = ''; 
    }
    
    function dbg_emit(text) { process.stdout.write(text); }
  }
  
  //--- PUBLIC INTERFACE ---
  
  return Template;
});