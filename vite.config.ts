import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Keep the WASM package out of dependency pre-bundling.
    // Its generated loader resolves the .wasm asset relative to import.meta.url.
    exclude: ["@briank-dev/pptx-to-html"],
  },
});
