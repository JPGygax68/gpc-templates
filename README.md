GPC-Templates
=============

GPC-Templates (GPC being the namespace I use for my firm) is a fledgling template engine that I wrote for the purpose of generating Node bindings. I separated it out from my code generator module called [CWrap] [1].

GPC-Templates superficially resembles [Mustache] [2] in that it uses double curly braces to delimit tags. But that's where the resemblence ends - where Mustache is an explicitly logic-less templating system, GPC-Templates is pretty much the opposite. As it was created to generate C++ code (though of course it can be used to generate other languages or indeed altogether different kinds of text files), and thus is intended as a tool for programmers, it supports constructs such as conditionals, iterators, and macros.

Getting started
---------------

I'm currently (at the time of writing) using GPC-Templates to generate Node bindings for OpenGL. That project isn't ripe for release yet, so I've just copied the current state of its template into the sample subdirectory. (Later, you will be able to the OpenGL bindings themselves, and possibly other projects, as samples.)

Let's get the template syntax out of the way - it's really simple:
  - Tags are introduced with the characters `{{$` and closed with `}}`.
  - The `foreach` (or its alias `forall`) tag will iterate over the elements of an array or object; the block it controls must be closed with a `end` tag.
  - The `if`, `elsif`, `else` and `end` tags will work together just as you'd expect them to. There is no need for parentheses after if or elsif; otherwise, the syntax is JavaScript, though array indices are not supported (yet?)
  - The `=` tag inserts a value into the code. It's an inline tag and does not need or support a closing `end`.
  - Tags starting with a dash `-` are considered comments. No closing tag.
  - The `macro` tag defines a named "subroutine"
  - The `call` tag executes a macro
  - The `list` tag (inline, no closing tag) is used to fill out the parameter list of a function call.

The module `gpc-templates` exports a constructor internally called `Template`, which takes the template code and filename for parameters (the filename is informative only, it is only used for error messages; it is up to you to read the template file).

The constructor function also has a "static" member `registerFunction()`. This takes two parameters, a function name and a Function object. Only functions registered in this way will be callable from your template (such as in if/elsif conditions or in placeholder elements); all JavaScript functions, builtin or other, are hidden.

2013-04-10 Jean-Pierre Gygax, practicomp.ch


  [1]: https://github.com/JPGygax68/node-cwrap
  [2]: http://mustache.github.com/
