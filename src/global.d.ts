import {} from 'hono'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string, js?:string, meta?:{
      title?:string,
      description?:string,
      image?:string,
      image_alt?:string,
      label1?:string
      value1?:string
      label2?:string
      value2?:string
    } }): Response
  }
}

type Bindings = {
  DB: D1Database;
}