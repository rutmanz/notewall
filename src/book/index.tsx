import { checkAccess, NotebookError, NotebookAccess, parseToken } from "@/db";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Bindings } from "@/global";
import router_login from "./login";

const app = new Hono<{ Bindings: Bindings }>();
app.route("/", router_login);

app.get("/book/:book", async (c) => {
	const token = getCookie(c, "token");
	const book = await parseToken(c.env, token);
	if (book.error == NotebookError.INVALID_BOOK) {
		return c.text("Book could not be found", 404);
	}
	if (book.access == NotebookAccess.NONE) {
		return c.redirect(`/book/${c.req.param("book")}/login`);
	}

	const notes = await c.env.DB.prepare("SELECT id, name, text, timestamp FROM quotes WHERE book=? ORDER BY timestamp DESC").bind(c.req.param("book")).all();
	const cards = notes.results.map((note) => {
		return (
			<div class="card mb-3">
				<div class="card-body">
					<a href={`/note/${note.id}`}>
						<button class="float-end btn btn-outline-primary btn-sm align-middle">Open</button>
					</a>
					{book.access == NotebookAccess.ADMIN && (
						<form action={`/book/${c.req.param("book")}/note/${note.id}/delete`} target="_self" method="post">
							<input type="hidden" name="id" value={note.id as string} />
							<button role="submit" class="btn btn-outline-danger btn-sm float-end mx-1">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
									<path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
								</svg>
							</button>
						</form>
					)}
					<blockquote class="blockquote mb-0">
						<p>{note.text}</p>
						<footer class="blockquote-footer">{note.name}</footer>
					</blockquote>
				</div>
				<div class="card-footer d-flex flex-row justify-content-end align-items-center">
					<span class="text-muted" title={new Date(note.timestamp as number).toLocaleTimeString()}>
						{new Date(note.timestamp as number).toLocaleDateString()}
					</span>
				</div>
			</div>
		);
	});

	return c.render(
		<div>
			<div class="modal fade" id="modal" aria-labelledby="modalLabel" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title" id="modalLabel">
								Add Note
							</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<form action={`/book/${c.req.param("book")}/note/create`} target="_self" method="post">
							<div class="modal-body">
								<div class="form-floating mb-3">
									<input name="name" type="text" class="form-control" id="form-speaker" required placeholder="Speaker's name here" />
									<label for="form-speaker">Author</label>
								</div>
								<div class="form-floating mb-3">
									<textarea name="text" class="form-control" id="form-note" required placeholder="Note here" style="height:8rem;"></textarea>
									<label for="form-note">Note</label>
								</div>
							</div>
							<div class="modal-footer">
								<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
									Close
								</button>
								<button type="submit" class="btn btn-outline-primary" data-bs-dismiss="modal">
									Submit
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
			<div class="row"></div>
			<div class="row">
				<div class="col-10 col-lg-6 mx-auto my-5">
					<div class="d-flex justify-content-between mb-3">
						<h1 class="mb-2">{book.data!.title!}</h1>
						<div class="d-flex gap-2">
							<button type="button" class="btn btn-outline-secondary mb-3" data-bs-toggle="modal" data-bs-target="#modal">
								Add Note
							</button>
							<a href={`/book/${book.data!.id!}/login`} class="btn btn-outline-warning mb-3">
								{book.access == NotebookAccess.ADMIN ? (
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-unlock" viewBox="0 0 16 16">
										<path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 2 0 0 0-2-2M3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z" />
									</svg>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-key-fill" viewBox="0 0 16 16">
										<path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2M2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
									</svg>
								)}
							</a>
						</div>
					</div>

					<div id="notes">{cards}</div>
				</div>
			</div>
		</div>
	);
});

app.post("/book/:book/note/create", async (c) => {
	const token = getCookie(c, "token");
	const book = await parseToken(c.env, token);
	if (book.error == NotebookError.INVALID_BOOK) {
		return c.text("Book could not be found", 404);
	}
	if (book.access == NotebookAccess.NONE) {
		return c.redirect(`/book/${c.req.param("book")}/login`);
	}

	const note = await c.req.formData();
	if (!note.has("text")) {
		return c.text("Please provide a note.", 400);
	}
	if (!note.has("name")) {
		return c.text("Please provide a name.", 400);
	}
	// console.log(await c.env.DB.prepare("SELECt * FROM notes").run())
	await c.env.DB.prepare("INSERT INTO quotes (id, book, text, name, timestamp) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), c.req.param("book"), note.get("text"), note.get("name"), Date.now()).run();
	return c.redirect(`/book/${c.req.param("book")}`);
});

app.get("/note/:note", async (c) => {
	const note = await c.env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(c.req.param("note")).first();
	if (!note) {
		return c.text("Quote could not be found", 404);
	}
	return c.render(
		<div class="container d-flex flex-column justify-content-center col-10 col-lg-6" style="min-height:100vh">
			<div class="card mb-2">
				<div class="card-body">
					<blockquote class="blockquote mb-0">
						<p>{note.text}</p>
						<footer class="blockquote-footer">{note.name}</footer>
					</blockquote>
				</div>
				<div class="card-footer d-flex flex-row justify-content-end">
					<span class="text-muted" title={new Date(note.timestamp as number).toLocaleTimeString()}>
						{new Date(note.timestamp as number).toLocaleDateString()}
					</span>
				</div>
			</div>
		</div>,
		{
			meta: {
				description: note.text as string,
				label1: "Author",
				value1: note.name as string,
				label2: "Date",
				value2: new Date(note.timestamp as number).toLocaleDateString(),
			},
		}
	);
});
app.post("/book/:book/note/:note/delete", async (c) => {
	const token = getCookie(c, "token");
	const book = await parseToken(c.env, token);
	if (book.error == NotebookError.INVALID_BOOK) {
		return c.text("Book could not be found", 404);
	}
	if (book.access < NotebookAccess.ADMIN) {
		return c.redirect(`/book/${c.req.param("book")}/login`);
	}
	// console.log(await c.env.DB.prepare("SELECt * FROM notes").run())
	await c.env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(c.req.param("note")).run();
	return c.redirect(`/book/${c.req.param("book")}`);
});

export default app;
