import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const name of ["index.html", "styles.css", "app.js", "bootstrap.js", "data.js", "logic.js", "theme-init.js", "assets", "chapters"]) {
  await cp(join(root, name), join(dist, name), { recursive: true });
}

console.log("Production build created in dist/");
