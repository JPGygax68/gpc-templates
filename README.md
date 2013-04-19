GPC-Templates
=============

GPC-Templates (GPC being the namespace I use for my firm) is a template engine that I wrote for the purpose of generating Node bindings. I separated it out from my code generator module called [CWrap] [1].

GPC-Templates superficially resembles [Mustache] [2] in that it uses double curly braces to delimit tags. But that's where the resemblence ends - where Mustache is an explicitly logic-less templating system, GPC-Templates is pretty much the opposite. As it was created to generate C++ code (though of course it can be used to generate other languages or indeed altogether different kinds of text files), and thus is intended as a tool for programmers, it supports constructs such as conditionals, iterators, and macros.

Getting started
---------------

GPC-Templates is "promisified", meaning that calling it's main `exec()` method will return immediately, but it's actual work will only be done once the *promise* it returned has been *resolved* (to learn how promises work, take a look at Kris Kowalski's [Q library] [3] that GPC-Templates uses). While this may at first glance look like an unnecessary complication, it makes it possible to generate very large files in a purely asynchrous environment such as a browser.

I'm currently using GPC-Templates to generate bindings for OpenGL and a closed-source DLL that is part of train simulator. Both these templates are at the experimental stage at the time of writing, but I've added them to the samples/ directory for you to look at.

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

As mentioned above, code generation starts upon calling the method `exec()`. This takes two parameters: the template code (which is a string) and the *writer*, obtained for example from a call to the [q-io] [5] method `open()`.

The constructor function also has a "static" member `registerFunction()`. This takes two parameters, a function name and a Function object. Only functions registered in this way will be callable from your template (such as in if/elsif conditions or in placeholder elements); all JavaScript functions, builtin or other, are hidden.

2013-04-20 Jean-Pierre Gygax, practicomp.ch


  [1]: https://github.com/JPGygax68/node-cwrap
  [2]: http://mustache.github.com/
  [3]: https://github.com/kriskowal/q
