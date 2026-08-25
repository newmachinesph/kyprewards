import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const appsDirectory = path.join(root, "apps");
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".next" || entry.name === "node_modules") continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(target);
  }
}

walk(appsDirectory);

const findings = [];

function attributesOf(node) {
  return new Map(
    node.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => [attribute.name.text.toString(), attribute]),
  );
}

for (const file of files) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  function inspect(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const attributes = attributesOf(node);
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const relative = path.relative(root, file);

      if (tag === "button" || tag === "Button") {
        const click = attributes.get("onClick");
        const type = attributes.get("type")?.initializer?.getText(source) ?? "";
        const submitsForm = /submit|reset/.test(type);
        if (!click && !submitsForm) {
          findings.push(`${relative}:${line} ${tag} has no action or form type`);
        }
        if (click?.initializer?.getText(source).includes("undefined")) {
          findings.push(`${relative}:${line} ${tag} has an undefined action`);
        }
      }

      if (tag === "a" || tag === "Link") {
        const href = attributes.get("href")?.initializer?.getText(source) ?? "";
        if (!href) findings.push(`${relative}:${line} ${tag} has no href`);
        if (/^["']#(["'])?$/.test(href) || /javascript:/i.test(href)) {
          findings.push(`${relative}:${line} ${tag} uses a placeholder href`);
        }
      }
    }
    ts.forEachChild(node, inspect);
  }

  inspect(source);
}

if (findings.length) {
  console.error(`Control audit failed with ${findings.length} finding(s):`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Control audit passed across ${files.length} frontend source files.`);
}
