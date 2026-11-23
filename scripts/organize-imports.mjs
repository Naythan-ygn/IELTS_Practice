import ts from "typescript";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(
  config.config,
  ts.sys,
  process.cwd(),
);
const host = {
  getScriptFileNames: () => parsed.fileNames,
  getScriptVersion: () => "0",
  getScriptSnapshot: (file) => {
    try {
      return ts.ScriptSnapshot.fromString(readFileSync(file, "utf8"));
    } catch {
      return undefined;
    }
  },
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
};
for (const name of readdirSync("components").filter((n) =>
  n.endsWith(".tsx"),
)) {
  const file = path.resolve("components", name);
  const service = ts.createLanguageService(host);
  const edits = service.organizeImports(
    { type: "file", fileName: file },
    {},
    {},
  );
  let source = readFileSync(file, "utf8");
  for (const change of edits
    .flatMap((e) => e.textChanges)
    .sort((a, b) => b.span.start - a.span.start))
    source =
      source.slice(0, change.span.start) +
      change.newText +
      source.slice(change.span.start + change.span.length);
  writeFileSync(file, source);
  service.dispose();
}
