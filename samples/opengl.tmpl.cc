{{$- use C++ macros for parameter handling ? }}

#include <node.h>
#include <node_buffer.h>
#include <v8.h>
//#include <GL/gl.h>
#include "glloader.h"
#include "arch_wrapper.h"
#include "utils.h"
#include "glutils.h"

using namespace v8;
using namespace node;
using namespace std;

//--- Utility routines ---

//--- "Passthru" lines from gl.spec ---

{{$foreach passthru}}
{{$=line}}
{{$end}}

//--- OpenGL API functions ---

{{$forall func_lib}}

{{$if !skip}}

extern "C" {
  {{$if builtin}}
  GLAPI void GLAPIENTRY gl{{$=name}}({{$list params c_type}});
  {{$else}}
  typedef GLAPI void (GLAPIENTRY *gl{{$=name}}Proc)({{$list params c_type}});
  {{$end}}
}

Handle<Value> 
{{$=name}}(const Arguments& args) {
  HandleScope scope;

  {{$if !builtin}}
  {{$call obtain_func_ptr}}
  {{$end if !builtin}}

  int param_index = 0;
  {{$forall params}}
  {{$call prep_input_param}}
  {{$end forall}}

  gl{{$=name}}({{$list params name}});
  
  {{$if return_param_count > 1}}
  {{$call return_outparams_map}}
  {{$elsif return_param_count == 1}}
  {{$call return_single_outparam}}
  {{$else}}
  return scope.Close(Undefined());
  {{$end}}
}

{{$end if !skip}}

{{$end forall functions}}

void 
init(Handle<Object> target) {

  //GLenum result = glloaderInit();
  //cerr << "glloaderInit() -> " << result << endl;
  
  // Functions
  {{$forall func_lib}}
  SetMethod(target, "{{$=name}}", {{$=name}} );
  {{$end}}

  // GL enums
  {{$forall enum_list}}
  setUintConstant(target, "{{$=name}}", {{$=value}});
  {{$end}}
}

NODE_MODULE(opengl, init)

{{$--- MACROS -----------------------------------------------------}}

{{$macro obtain_func_ptr}}
  static gl{{$=name}}Proc gl{{$=name}} = nullptr;  
  if (!gl{{$=name}}) {
    gl{{$=name}} = (gl{{$=name}}Proc) glloaderGetProcAddress("gl{{$=name}}");
    if (!gl{{$=name}}) return ThrowException(Exception::Error(String::New("Failed to load GL function {{$=name}}")));
  }
{{$end macro}}

{{$macro prep_input_param}}
  {{$if map_to_retval && size_expr == '1'}}
  {{$=c_type}} {{$=name}}_val, {{$=name}} = & {{$=name}}_val;
  {{$elsif c_type == 'GLvoid' && access == 'reference'}}
  {{$=c_type}} {{$=name}} = External::Unwrap(args[{{$=index}}]);
  {{$elsif access == 'array' && autoalloc_buffer}}
  Local<Object> {{$=name}}_obj;
  if (args.Length() > param_index) {
    {{$=name}}_obj = args[param_index]->ToObject();
    if ({{$=name}}_obj->GetIndexedPropertiesExternalArrayDataType() != {{$=v8ExternalArrayType(elt_type)}})
       return ThrowException(Exception::TypeError(String::New("Parameter \"{{$=name}}\" must be an ArrayBuffer of \"{{$=elt_type}}\" elements")));
    param_index ++;
  }
  else {{$=name}}_obj = makeArrayBuffer("{{$=v8BufferType(elt_type)}}", {{$=size_expr}});
  {{$=c_type}} {{$=name}} = static_cast<{{$=c_type}}>({{$=name}}_obj->GetIndexedPropertiesExternalArrayData());
  {{$elsif access == 'array'}}
  Local<Object> {{$=name}}_obj = args[param_index]->ToObject();
  if ({{$=name}}_obj->GetIndexedPropertiesExternalArrayDataType() != {{$=v8ExternalArrayType(elt_type)}})
     return ThrowException(Exception::TypeError(String::New("Parameter {{$=name}} must be an array buffer of {{$=c_type}}")));
  {{$=c_type}} {{$=name}} = static_cast<{{$=c_type}}>({{$=name}}_obj->GetIndexedPropertiesExternalArrayData());
  param_index ++;
  {{$else}}
  {{$=c_type}} {{$=name}} = static_cast<{{$=c_type}}>( args[param_index++]->{{$=v8TypeAccessor(c_type)}}() );
  {{$end}}
{{$end macro}}

{{$macro return_outparams_map}}
  Local<Object> retval = Object::New();
  {{$forall params}}
  {{$if map_to_retval}}
  retval->Set(String::New("{{$=name}}"), {{$=v8TypeWrapper(c_type)}}::New({{$=name}}) );
  {{$end if}}
  {{$end forall params}}
  return scope.Close(retval);
{{$end macro}}

{{$macro return_single_outparam}}
  {{$if returns_array_buffer}}
  return scope.Close({{$=retval.param_name}}_obj);
  {{$else}}
  return scope.Close({{$=v8TypeWrapper(retval.c_type)}}::New({{$=retval.param_name}}));
  {{$end}}
{{$end macro}}
