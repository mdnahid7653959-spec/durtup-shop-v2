import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function sigmaDevApiPlugin() {
  return {
    name: "sigma-dev-api-plugin",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith("/api/ai/")) {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.statusCode = 200;
            return res.end();
          }

          if (req.method === "POST") {
            let bodyStr = "";
            req.on("data", (chunk: any) => { bodyStr += chunk; });
            req.on("end", async () => {
              try {
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                const { handleSigmaChatRequest, executeConfirmOrder } = await server.ssrLoadModule("./src/server/sigmaServerEngine.ts");
                
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");

                if (req.url.includes("/confirm")) {
                  const result = executeConfirmOrder(body);
                  res.statusCode = 200;
                  return res.end(JSON.stringify(result));
                }

                const response = await handleSigmaChatRequest(body);
                res.statusCode = 200;
                return res.end(JSON.stringify(response));
              } catch (err: any) {
                console.error("[Sigma Dev API Middleware Error]:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                return res.end(JSON.stringify({
                  text: "দুঃখিত, এই মুহূর্তে তথ্যটি আনতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।"
                }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/mohasagor": {
        target: "https://mohasagor.com.bd",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mohasagor/, ""),
      },
      "/api/ecomseller": {
        target: "https://ecomsellerbd.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ecomseller/, ""),
        headers: {
          "referer": "https://ecomsellerbd.com/catalog",
          "origin": "https://ecomsellerbd.com",
        },
      },
    },
  },
  plugins: [react(), sigmaDevApiPlugin()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    minify: "esbuild",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-icons": ["lucide-react"],
          "vendor-charts": ["recharts"],
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
        },
      },
    },
  },
}));
