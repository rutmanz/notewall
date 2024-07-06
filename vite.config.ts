import build from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    tsconfigPaths(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
