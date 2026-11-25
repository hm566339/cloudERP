import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const rawProxyTarget = env.VITE_SSO_BASE_URL || env.VITE_API_BASE_URL || "http://localhost:8080";
  const cleanedTarget = rawProxyTarget.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  const proxyTarget = (cleanedTarget && cleanedTarget !== '') ? cleanedTarget : "http://localhost:8080";

  const commTarget = (env.VITE_COMMUNICATION_API_URL || "http://localhost:8084").trim().replace(/\/+$/, '');

  return {
    base: env.VITE_BASE_PATH || "/erp/",
    plugins: [react()],
    define: {
      global: 'window',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react-is"],
    },
    build: {
      target: "es2020",
      cssCodeSplit: true,
      minify: mode === "production" ? "terser" : "esbuild",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
    },
    // Dev server configuration
    server: {
      port: 3001,
      strictPort: false,
      host: true,
      headers: {
        'Cache-Control': 'no-store',
      },
      // Proxy API requests to backend
      proxy: {
        "/api/communication": {
          target: commTarget,
          changeOrigin: true,
          secure: false,
        },
        "/ws-chat": {
          target: commTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false, // Don't verify SSL certs for proxy
          cookieDomainRewrite: {
            "*": "",
          },
          cookiePathRewrite: {
            "*": "/",
          },
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "69420");
              proxyReq.removeHeader("Origin");

              // Forward the ACCESS_TOKEN cookie as an Authorization header
              const cookieHeader = req.headers.cookie;
              if (cookieHeader) {
                const cookies = cookieHeader
                  .split(";")
                  .reduce((acc, cookie) => {
                    const [key, ...v] = cookie.trim().split("=");
                    acc[key] = v.join("=");
                    return acc;
                  }, {});

                let token = cookies["ACCESS_TOKEN"];

                // Fallback for dynamic suffixes (e.g., ACCESS_TOKEN_000001)
                if (!token) {
                  const dynamicKey = Object.keys(cookies).find(k => k.startsWith('ACCESS_TOKEN'));
                  if (dynamicKey) token = cookies[dynamicKey];
                }

                // Ignore dummy 'cookie session' values from auth_token
                if (!token && cookies['auth_token'] && !cookies['auth_token'].includes('cookie session') && !cookies['auth_token'].includes('cookie-session')) {
                  token = cookies['auth_token'];
                }

                if (token && !token.includes('cookie session') && !token.includes('cookie-session')) {
                  proxyReq.setHeader("Authorization", `Bearer ${token}`);
                }
              }
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              const cookies = proxyRes.headers["set-cookie"];
              if (cookies) {
                proxyRes.headers["set-cookie"] = cookies.map((cookie) => {
                  return cookie
                    .replace(/;\s*Secure/gi, "")
                    .replace(/Secure/gi, "")
                    .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
                    .replace(/SameSite=None/gi, "SameSite=Lax")
                    .replace(/;\s*HttpOnly/gi, "")
                    .replace(/HttpOnly/gi, "");
                });
              }
            });
          },
        },
      },
    },
    // Preview server configuration (for npm run preview)
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
      proxy: {
        "/api/communication": {
          target: commTarget,
          changeOrigin: true,
          secure: false,
        },
        "/ws-chat": {
          target: commTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false, // Don't verify SSL certs for proxy
          cookieDomainRewrite: {
            "*": "",
          },
          cookiePathRewrite: {
            "*": "/",
          },
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "69420");
              proxyReq.removeHeader("Origin");

              // Forward the ACCESS_TOKEN cookie as an Authorization header
              const cookieHeader = req.headers.cookie;
              if (cookieHeader) {
                const cookies = cookieHeader
                  .split(";")
                  .reduce((acc, cookie) => {
                    const [key, ...v] = cookie.trim().split("=");
                    acc[key] = v.join("=");
                    return acc;
                  }, {});

                let token = cookies["ACCESS_TOKEN"];

                // Fallback for dynamic suffixes (e.g., ACCESS_TOKEN_000001)
                if (!token) {
                  const dynamicKey = Object.keys(cookies).find(k => k.startsWith('ACCESS_TOKEN'));
                  if (dynamicKey) token = cookies[dynamicKey];
                }

                // Ignore dummy 'cookie session' values from auth_token
                if (!token && cookies['auth_token'] && !cookies['auth_token'].includes('cookie session') && !cookies['auth_token'].includes('cookie-session')) {
                  token = cookies['auth_token'];
                }

                if (token && !token.includes('cookie session') && !token.includes('cookie-session')) {
                  proxyReq.setHeader("Authorization", `Bearer ${token}`);
                }
              }
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              const cookies = proxyRes.headers["set-cookie"];
              if (cookies) {
                proxyRes.headers["set-cookie"] = cookies.map((cookie) => {
                  return cookie
                    .replace(/;\s*Secure/gi, "")
                    .replace(/Secure/gi, "")
                    .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
                    .replace(/SameSite=None/gi, "SameSite=Lax")
                    .replace(/;\s*HttpOnly/gi, "")
                    .replace(/HttpOnly/gi, "");
                });
              }
            });
          },
        },
      },
    },
    // Optimization settings
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "axios"],
      exclude: ["vite/modulepreload", "vite/client"],
    },
  };
});
