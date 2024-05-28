import {} from 'hono'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string, js?:string }): Response
  }
}

type Bindings = {
  DB: D1Database;
}