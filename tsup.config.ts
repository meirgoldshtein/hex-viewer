import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], 
  format: ["cjs", "esm"],  
  dts: true,             
  minify: true,           
  sourcemap: true,         
  external: [
    "react",
    "react-dom",
    "@mui/material",
    "@emotion/react",
    "@emotion/styled"
  ]
});
