/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite carrega WASM em runtime: precisa ficar fora do bundle do servidor.
  serverExternalPackages: ["@electric-sql/pglite"],
};
export default nextConfig;
