import { defineConfig, build, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { componentTagger } from "lovable-tagger";

/** After the client build, render the landing page to HTML and inject it into dist/index.html. */
function prerenderLanding(): Plugin {
  let clientOutDir = "dist";
  return {
    name: "prerender-landing",
    apply: "build",
    configResolved(c) { if (!c.build.ssr) clientOutDir = path.resolve(c.root, c.build.outDir); },
    async closeBundle() {
      if (process.env.PRERENDER_SSR) return;
      process.env.PRERENDER_SSR = "1";
      const outDir = path.resolve(__dirname, "node_modules/.prerender");
      try {
        await build({
          configFile: path.resolve(__dirname, "vite.config.ts"),
          logLevel: "warn",
          build: { ssr: "src/entry-server.tsx", outDir, emptyOutDir: true, copyPublicDir: false },
        });
        const entry = fs.readdirSync(outDir).find(f => f.startsWith("entry-server"))!;
        const { render } = await import(pathToFileURL(path.join(outDir, entry)).href + `?t=${Date.now()}`);
        const htmlPath = path.join(clientOutDir, "index.html");
        const html = fs.readFileSync(htmlPath, "utf8").replace('<div id="root"></div>', `<div id="root">${render()}</div>`);
        fs.writeFileSync(htmlPath, html);
      } catch (err) {
        console.warn("[prerender-landing] skipped:", err);
      } finally {
        delete process.env.PRERENDER_SSR;
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    prerenderLanding(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  ssr: {
    noExternal: ["react-dropzone", "sonner", "lucide-react"],
  },
  optimizeDeps: {
    force: true,
  },
}));
