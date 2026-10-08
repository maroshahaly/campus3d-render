import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.data.*;
import ghidra.program.model.symbol.SourceType;
import java.io.*;
public class Redo extends GhidraScript {
  Function fn(String a){ return getFunctionAt(toAddr(a)); }
  public void run() throws Exception {
    String[] a = getScriptArgs();
    // seek(fd, int off, int whence)
    for (String s : new String[]{"00171e58","00171cb8"}) {
      Function f = fn(s);
      ParameterImpl[] ps = new ParameterImpl[]{
        new ParameterImpl("fd", IntegerDataType.dataType, currentProgram),
        new ParameterImpl("off", IntegerDataType.dataType, currentProgram),
        new ParameterImpl("offhi", IntegerDataType.dataType, currentProgram),
        new ParameterImpl("whence", IntegerDataType.dataType, currentProgram)};
      f.replaceParameters(Function.FunctionUpdateType.DYNAMIC_STORAGE_ALL_PARAMS, true, SourceType.USER_DEFINED, ps);
      f.setName(s.equals("00171e58")?"hseek":"hseek_impl", SourceType.USER_DEFINED);
    }
    Function rd = fn("00171a68");
    rd.setName("hread", SourceType.USER_DEFINED);
    DecompInterface di = new DecompInterface(); di.openProgram(currentProgram);
    PrintWriter pw = new PrintWriter(new FileWriter(a[0]));
    for (int i=1;i<a.length;i++){
      Function f = fn(a[i]);
      DecompileResults r = di.decompileFunction(f, 120, monitor);
      pw.println("// ==== "+f.getName()+" @ "+a[i]);
      pw.println(r.getDecompiledFunction().getC());
    }
    pw.close();
  }
}
