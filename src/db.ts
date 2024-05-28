

export enum NotebookError {
    "DATABASE_ERROR"="Database error",
    "INVALID_KEY"="Invalid key",
    "INVALID_BOOK"="Unknown book"
}

export enum NotebookAccess {
    "USER"  = 1,
    "ADMIN" = 2,
    "NONE"  = 0
}

export async function accessBook(db:D1Database, id:string, key:string) {
    const book = await db.prepare("SELECT * FROM books WHERE id = ?").bind(id).first()
    if (!book) {
        return {data: null, error: NotebookError.INVALID_BOOK}
    }
    // console.log(book.key, await hash(key), key)
    if (book.key !== await hash(key)) {
        return {data: book, error: NotebookError.INVALID_KEY}
    }
    delete book.key
    return {data:book, error:null}
}

type BookRow = {
    id?: string;
    title?: string;
    key?: string;
    admin_key?: string;
}
export async function checkAccess(db:D1Database, book_id?:string|null, key?:string|null): Promise<{data?: BookRow, error?: NotebookError, access: NotebookAccess}> {
    if (!book_id) {
        return {error: NotebookError.INVALID_BOOK, access: NotebookAccess.NONE}
    }
    
    const book:BookRow|null = await db.prepare("SELECT * FROM books WHERE id = ?").bind(book_id).first()
    if (!book) {
        return {error: NotebookError.INVALID_BOOK, access: NotebookAccess.NONE}
    }
    if (!key) {
        return {data:book, error: NotebookError.INVALID_KEY, access: NotebookAccess.NONE}
    }
    if (book.admin_key == await hash(key)) {
        return {data: book, access: NotebookAccess.ADMIN}
    }
    if (book.key == await hash(key)) {
        return {data: book, access: NotebookAccess.USER}
    }
    
    return {data: book, error: NotebookError.INVALID_KEY, access: NotebookAccess.NONE}
}

export async function accessQuotes(db:D1Database, bookid:string, key:string) {
    const book = await accessBook(db, bookid, key)
    if (book.error != null) {
        return {data: null, error: book.error}
    }
    const quotes = await db.prepare("SELECT name, text, timestamp FROM quotes WHERE book=?").bind(bookid).all()
    if (quotes.error) {
        console.error(quotes)
        return {data:null, error:NotebookError.DATABASE_ERROR}
    }
    return {data:quotes, error:null}
}

export async function hash(str: string) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}