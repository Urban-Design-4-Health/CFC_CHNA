import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'mapbox-gl',
      'react-widgets/styles.css"',
      'react-widgets/DropdownList',
      'mapbox-gl/dist/mapbox-gl.css',
      'mapboxgl-legend/dist/style.css',
      './assets/CFC_logo.png',
      './assets/Logo2.png',
      './assets/red_thin.png',
      './assets/hatch_leg.png',

    ],
  },
  plugins: [react(),
    resolve(), // Resolve modules from node_modules
    commonjs(), // Convert CommonJS modules to ES modules
  ],
  build:{
    outDir: "build"
  }
})
