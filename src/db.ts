
import jwt from '@tsndr/cloudflare-worker-jwt'
import { Bindings } from './global'

export enum NotebookError {
    "DATABASE_ERROR" = "Database error",
    "INVALID_KEY" = "Invalid key",
    "INVALID_BOOK" = "Unknown book"
}

export enum NotebookAccess {
    "USER" = 1,
    "ADMIN" = 2,
    "NONE" = 0
}

export async function accessBook(env: Bindings, id: string, key: string) {
    const book = await env.DB.prepare("SELECT * FROM books WHERE id = ?").bind(id).first()
    if (!book) {
        return { data: null, error: NotebookError.INVALID_BOOK }
    }
    // console.log(book.key, await hash(key), key)
    if (book.key !== await hash(key)) {
        return { data: book, error: NotebookError.INVALID_KEY }
    }
    delete book.key
    return { data: book, error: null }
}

type BookRow = {
    id?: string;
    title?: string;
    key?: string;
    admin_key?: string;
}

export async function createToken(env: Bindings, book_id: string, key: string) {
    console.log(process.env)
    const access = await checkAccess(env, book_id, key)
    if (access.error != null) {
        return { error: access.error }
    }
    const token = await jwt.sign({ book: book_id, access: access.access, issued: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 365 }, env.NOTEWALL_SECRET)
    return { token }
}

export async function parseToken(env: Bindings, token?: string) {
    if (!token) {
        return { error: NotebookError.INVALID_KEY, access: NotebookAccess.NONE }
    }
    const isValid = jwt.verify(token, env.NOTEWALL_SECRET)
    if (!isValid) {
        return { error: NotebookError.INVALID_KEY, access: NotebookAccess.NONE }
    }
    const { payload } = jwt.decode(token) as { payload: { book: string, access: NotebookAccess, issued: number } }
    const book = await env.DB.prepare("SELECT * FROM books WHERE id = ?").bind(payload.book).first()
    if (!book) {
        return { error: NotebookError.INVALID_BOOK, access: NotebookAccess.NONE }
    }
    return { data: book, access: payload.access }
}

export async function getBook(env: Bindings, book_id: string) {
    const book = await env.DB.prepare("SELECT * FROM books WHERE id = ?").bind(book_id).first()
    return book
}

export async function checkAccess(env: Bindings, book_id?: string | null, key?: string | null): Promise<{ data?: BookRow, error?: NotebookError, access: NotebookAccess }> {
    if (!book_id) {
        return { error: NotebookError.INVALID_BOOK, access: NotebookAccess.NONE }
    }

    const book: BookRow | null = await env.DB.prepare("SELECT * FROM books WHERE id = ?").bind(book_id).first()
    if (!book) {
        return { error: NotebookError.INVALID_BOOK, access: NotebookAccess.NONE }
    }
    if (!key) {
        return { data: book, error: NotebookError.INVALID_KEY, access: NotebookAccess.NONE }
    }
    if (book.admin_key == await hash(key)) {
        return { data: book, access: NotebookAccess.ADMIN }
    }
    if (book.key == await hash(key)) {
        return { data: book, access: NotebookAccess.USER }
    }

    return { data: book, error: NotebookError.INVALID_KEY, access: NotebookAccess.NONE }
}

export async function accessQuotes(env: Bindings, bookid: string, key: string) {
    const book = await accessBook(env, bookid, key)
    if (book.error != null) {
        return { data: null, error: book.error }
    }
    const quotes = await env.DB.prepare("SELECT name, text, timestamp FROM quotes WHERE book=?").bind(bookid).all()
    if (quotes.error) {
        console.error(quotes)
        return { data: null, error: NotebookError.DATABASE_ERROR }
    }
    return { data: quotes, error: null }
}

export async function hash(str: string) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}