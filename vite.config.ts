import { defineConfig, type Plugin } from "vite";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function dayEditorPlugin(): Plugin {
  return {
    name: "day-editor-save",
    configureServer(server) {
      server.middlewares.use("/__editor/save-sprites", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          let body = "";
          for await (const chunk of req) body += chunk;
          const parsed = JSON.parse(body) as { category?: unknown; data?: unknown };
          const category = parsed.category;
          if (
            category !== "cars" &&
            category !== "icons" &&
            category !== "doc" &&
            category !== "palette"
          ) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "category must be cars|icons|doc|palette" }));
            return;
          }
          if (!parsed.data || typeof parsed.data !== "object") {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "data must be an object" }));
            return;
          }
          // Shape-specific validation
          const data = parsed.data as Record<string, unknown>;
          if (category === "palette") {
            const pd = data as { base?: unknown; carColours?: unknown };
            if (
              !pd.base ||
              typeof pd.base !== "object" ||
              !pd.carColours ||
              typeof pd.carColours !== "object"
            ) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ error: "palette needs base + carColours objects" }));
              return;
            }
          } else {
            // grid categories: every value must be a string
            for (const [k, v] of Object.entries(data)) {
              if (typeof v !== "string") {
                res.statusCode = 400;
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ error: `${category}.${k} must be a string grid` }));
                return;
              }
            }
          }
          const root = server.config.root;
          const file = resolve(root, join("src", "data", "sprites", `${category}.json`));
          const json = JSON.stringify(parsed.data, null, 2) + "\n";
          await writeFile(file, json, "utf8");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, file: `src/data/sprites/${category}.json` }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      server.middlewares.use("/__editor/save-tuning", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          let body = "";
          for await (const chunk of req) body += chunk;
          const parsed = JSON.parse(body) as { tuning?: unknown };
          const t = parsed.tuning as
            | {
                shiftStart?: unknown;
                wages?: { correct?: unknown; wrong?: unknown; flawlessBonus?: unknown };
              }
            | undefined;
          if (
            !t ||
            typeof t.shiftStart !== "string" ||
            !/^([0-2]\d):([0-5]\d)$/.test(t.shiftStart) ||
            !t.wages ||
            !Number.isFinite(t.wages.correct as number) ||
            !Number.isFinite(t.wages.wrong as number) ||
            !Number.isFinite(t.wages.flawlessBonus as number)
          ) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(
              JSON.stringify({
                error: "tuning needs shiftStart HH:MM + wages.correct/wrong/flawlessBonus numbers",
              }),
            );
            return;
          }
          const root = server.config.root;
          const file = resolve(root, join("src", "data", "tuning.json"));
          const clean = {
            shiftStart: t.shiftStart,
            wages: {
              correct: Number(t.wages.correct),
              wrong: Number(t.wages.wrong),
              flawlessBonus: Number(t.wages.flawlessBonus),
            },
          };
          const json = JSON.stringify(clean, null, 2) + "\n";
          await writeFile(file, json, "utf8");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, file: "src/data/tuning.json" }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      server.middlewares.use("/__editor/save-streets", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          let body = "";
          for await (const chunk of req) body += chunk;
          const parsed = JSON.parse(body) as { streets?: unknown };
          if (!Array.isArray(parsed.streets)) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "streets must be an array" }));
            return;
          }
          const ALLOWED_KINDS = new Set([
            "pay-and-display",
            "permit",
            "double-yellow",
            "single-yellow",
            "loading-bay",
          ]);
          const ALLOWED_ZONES = new Set([null, "A", "B", "C"]);
          for (const s of parsed.streets) {
            if (
              !s ||
              typeof s !== "object" ||
              typeof (s as { id?: unknown }).id !== "string" ||
              typeof (s as { name?: unknown }).name !== "string" ||
              !ALLOWED_KINDS.has((s as { kind?: unknown }).kind as string) ||
              !ALLOWED_ZONES.has((s as { zone?: unknown }).zone as string | null)
            ) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({
                  error: "each street needs id, name (strings), valid kind, zone null|A|B|C",
                }),
              );
              return;
            }
          }
          const root = server.config.root;
          const file = resolve(root, join("src", "data", "streets.json"));
          const json = JSON.stringify(parsed.streets, null, 2) + "\n";
          await writeFile(file, json, "utf8");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, file: "src/data/streets.json" }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      server.middlewares.use("/__editor/save-residents", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          let body = "";
          for await (const chunk of req) body += chunk;
          const parsed = JSON.parse(body) as { residents?: unknown };
          if (!Array.isArray(parsed.residents)) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "residents must be an array" }));
            return;
          }
          for (const r of parsed.residents) {
            if (
              !r ||
              typeof r !== "object" ||
              typeof (r as { id?: unknown }).id !== "string" ||
              typeof (r as { name?: unknown }).name !== "string" ||
              typeof (r as { plate?: unknown }).plate !== "string" ||
              typeof (r as { bio?: unknown }).bio !== "string"
            ) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({ error: "each resident needs id, name, plate, bio (strings)" }),
              );
              return;
            }
          }
          const root = server.config.root;
          const file = resolve(root, join("src", "data", "residents.json"));
          const json = JSON.stringify(parsed.residents, null, 2) + "\n";
          await writeFile(file, json, "utf8");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, file: "src/data/residents.json" }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

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
          if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 99) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "day must be an integer 1..99" }));
            return;
          }
          if (!parsed.raw || typeof parsed.raw !== "object") {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "raw must be an object" }));
            return;
          }
          const root = server.config.root;
          const file = resolve(root, join("src", "data", "days", `day${day}.json`));
          if (!file.startsWith(resolve(root, "src", "data", "days") + "/")) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "path escape" }));
            return;
          }
          const json = JSON.stringify(parsed.raw, null, 2) + "\n";
          await writeFile(file, json, "utf8");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, file: `src/data/days/day${day}.json` }));
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
