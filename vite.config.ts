import { defineConfig, type Plugin } from "vite";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function dayEditorPlugin(): Plugin {
  return {
    name: "day-editor-save",
    configureServer(server) {
      server.middlewares.use("/__editor/save", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          let body = "";
          for await (const chunk of req) body += chunk;
          const parsed = JSON.parse(body) as { day?: unknown; raw?: unknown };
          const day = parsed.day;
          if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 6) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "day must be an integer 1..6" }));
            return;
          }
          if (!parsed.raw || typeof parsed.raw !== "object") {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "raw must be an object" }));
            return;
          }
          const root = server.config.root;
          const file = resolve(root, join("src", "game", "days", `day${day}.json`));
          if (!file.startsWith(resolve(root, "src", "game", "days") + "/")) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "path escape" }));
            return;
          }
          const json = JSON.stringify(parsed.raw, null, 2) + "\n";
          await writeFile(file, json, "utf8");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, file: `src/game/days/day${day}.json` }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [dayEditorPlugin()],
  server: {
    port: Number(process.env.PORT) || 5174,
    strictPort: false,
  },
});
