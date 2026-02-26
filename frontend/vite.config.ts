import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import EnvironmentPlugin from "vite-plugin-environment";
import path from "path";
import fs from "fs";

// Load canister IDs from canister_ids.json
function loadCanisterIds(): Record<string, string> {
  const result: Record<string, string> = {};

  // Determine network
  const network = process.env.DFX_NETWORK || "local";

  // Try canister_ids.json (production/ic IDs)
  const canisterIdsPath = path.resolve(__dirname, "../canister_ids.json");
  if (fs.existsSync(canisterIdsPath)) {
    try {
      const canisterIds = JSON.parse(fs.readFileSync(canisterIdsPath, "utf-8"));
      for (const [name, networks] of Object.entries(canisterIds)) {
        const ids = networks as Record<string, string>;
        // Prefer the matching network, fall back to ic, then local
        const id = ids[network] || ids["ic"] || ids["local"];
        if (id) {
          const envKey = `CANISTER_ID_${name.toUpperCase().replace(/-/g, "_")}`;
          result[envKey] = id;
          // Also set VITE_ prefixed version for direct access
          result[`VITE_${envKey}`] = id;
        }
      }
    } catch (e) {
      console.warn("Could not parse canister_ids.json:", e);
    }
  }

  // Try .dfx/local/canister_ids.json for local development
  const localCanisterIdsPath = path.resolve(
    __dirname,
    "../.dfx/local/canister_ids.json"
  );
  if (fs.existsSync(localCanisterIdsPath)) {
    try {
      const localCanisterIds = JSON.parse(
        fs.readFileSync(localCanisterIdsPath, "utf-8")
      );
      for (const [name, networks] of Object.entries(localCanisterIds)) {
        const ids = networks as Record<string, string>;
        const id = ids["local"] || ids[network];
        if (id) {
          const envKey = `CANISTER_ID_${name.toUpperCase().replace(/-/g, "_")}`;
          // Only set if not already set by canister_ids.json (production takes precedence on ic network)
          if (network === "local" || !result[envKey]) {
            result[envKey] = id;
            result[`VITE_${envKey}`] = id;
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse .dfx/local/canister_ids.json:", e);
    }
  }

  return result;
}

const canisterEnvVars = loadCanisterIds();

export default defineConfig({
  plugins: [
    react(),
    EnvironmentPlugin("all", { prefix: "CANISTER_" }),
    EnvironmentPlugin("all", { prefix: "DFX_" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Inject all canister ID env vars so they are available at runtime
    ...Object.fromEntries(
      Object.entries(canisterEnvVars).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ])
    ),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4943",
        changeOrigin: true,
      },
    },
  },
});
