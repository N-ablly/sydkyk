import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: { exclude: ["node_modules/**", ".next/**", "SYDKYK_enterprise_pack_v2*/**"] },
});
