import { Hono } from 'hono'
import { accessBook, accessQuotes, hash } from './db';
import { Bindings } from './global';


const app = new Hono<{Bindings:Bindings}>()

type QuoteData = {
    id?: string;
    book?: string;
    text?: string;
    name?: string;
    timestamp?: number;
    key?: string;
}

app.post("/quotes", async (c) => {
    const quote:QuoteData = await c.req.json()
    if (!quote.book) {
        return c.json({ message: "Please provide a book name." }, 400)
    }
    if (!quote.text) {
        return c.json({ message: "Please provide a quote." }, 400)
    }
    if (!quote.name) {
        return c.json({ message: "Please provide a speaker." }, 400)
    }
    if (!quote.key) {
        return c.json({ message: "Please provide the book's key." }, 400)
    }
    const book = await accessBook(c.env.DB, quote.book, quote.key)
    if (book.error != null) {
        return c.json({ message: book.error }, 403)
    }
    // console.log(await c.env.DB.prepare("SELECt * FROM quotes").run())
    const result = await c.env.DB.prepare("INSERT INTO quotes (id, book, text, name, timestamp) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), quote.book, quote.text, quote.name, Date.now()).run()
    return c.json({  message: result.success ? "Quote saved!" : result.error }, result.success ? 200:500)
})

app.get("/quotes", async (c) => {
    const query = await c.req.query()
    if (!query.book) {
        return c.json({ message: "Please provide a book name." }, 400)
    }
    if (!query.key) {
        return c.json({ message: "Please provide a book key." }, 400)
    }
    const quotes = await accessQuotes(c.env.DB, query.book, query.key)
    if (quotes.error != null) {
        return c.json({ message: quotes.error }, 403)
    }
    return c.json({ message:"Quotes retrieved successfully", quotes: quotes.data})
})



type BookData = {
    id?: string;
    title?: string;
    key?: string;
}

app.post("/books", async (c) => {
    const book:BookData = await c.req.json()
    if (!book.id) {
        return c.json({ message: "Please provide an identifier." }, 400)
    }
    book.id = book.id.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30)
    if (!book.title) {
        return c.json({ message: "Please provide a title." },400)
    }
    if (!book.key) {
        return c.json({ message: "Please provide a key." },400)
    }
    const exists = await c.env.DB.prepare("SELECT 1 FROM books WHERE id = ?").bind(book.id).first()
    if (exists) {
        return c.json({ message: "Book already exists." }, 403)
    }
    // console.log(await c.env.DB.prepare("SELECt * FROM quotes").run())
    
    const result = await c.env.DB.prepare("INSERT INTO books (id, title, key) VALUES (?,?,?)").bind(book.id, book.title, await hash(book.key)).run()
    return c.json({ message: result.success ? "Book created!" : result.error, id: book.id }, result.success ? 200:500)
})

app.get("/books", async (c) => {
    const result = await c.env.DB.prepare("SELECT id, title FROM books").all()
    return c.json({message:result.success?"Books retrieved successfully":result.error, books: result.results}, result.success?200:500)
})



export default app