import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
  plugins: [react(),
    resolve(), // Resolve modules from node_modules
    commonjs(), // Convert CommonJS modules to ES modules
  ],
  build:{
    outDir: "build"
  }
})
