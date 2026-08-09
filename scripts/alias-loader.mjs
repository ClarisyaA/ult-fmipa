import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const rootDir = path.resolve(".");

register(
  "data:text/javascript," +
    encodeURIComponent(`
    import { pathToFileURL, fileURLToPath } from "node:url";
    import path from "node:path";
    import fs from "node:fs";
    const rootDir = ${JSON.stringify(rootDir)};

    function tryResolveFilePath(filePath) {
      try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          return pathToFileURL(filePath).href;
        }
        if (!path.extname(filePath)) {
          if (fs.existsSync(filePath + ".ts")) {
            return pathToFileURL(filePath + ".ts").href;
          }
          if (fs.existsSync(filePath + ".tsx")) {
            return pathToFileURL(filePath + ".tsx").href;
          }
          if (fs.existsSync(path.join(filePath, "index.ts"))) {
            return pathToFileURL(path.join(filePath, "index.ts")).href;
          }
        }
      } catch {}
      return null;
    }

    export function resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        const fullPath = path.join(rootDir, "src", specifier.slice(2));
        const resolved = tryResolveFilePath(fullPath);
        if (resolved) {
          return { url: resolved, shortCircuit: true };
        }
      }

      if (
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        context.parentURL &&
        context.parentURL.startsWith("file://")
      ) {
        const parentPath = fileURLToPath(context.parentURL);
        const fullPath = path.resolve(path.dirname(parentPath), specifier);
        const resolved = tryResolveFilePath(fullPath);
        if (resolved) {
          return { url: resolved, shortCircuit: true };
        }
      }

      return nextResolve(specifier, context);
    }
  `),
  pathToFileURL(path.join(rootDir, "package.json")).href
);
