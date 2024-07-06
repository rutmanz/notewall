
import { checkAccess, NotebookError, NotebookAccess } from "@/db";
import {Hono} from "hono";
import { getCookie } from "hono/cookie";
import { Bindings } from "@/global";
import router_login from "./login";

const app = new Hono<{ Bindings: Bindings }>()
app.route("/", router_login)


app.get("/book/:book", async (c) => {
	const key = getCookie(c, "key");
	const book = await checkAccess(c.env.DB, c.req.param("book"), key);
	if (book.error == NotebookError.INVALID_BOOK) {
		return c.text("Book could not be found", 404);
	}
	if (book.access == NotebookAccess.NONE) {
		return c.redirect(`/book/${c.req.param("book")}/login`);
	}

	const notes = await c.env.DB.prepare("SELECT id, name, text, timestamp FROM quotes WHERE book=? ORDER BY timestamp DESC").bind(c.req.param("book")).all();
	const cards = notes.results.map((note) => {
		return (
			<div class="card mb-2">
				<div class="card-body">
					{book.access == NotebookAccess.ADMIN && (
					<form action={`/book/${c.req.param("book")}/note/${note.id}/delete`} target="_self" method="post">
						<input type="hidden" name="id" value={note.id as string} />
						<input type="submit" class="btn btn-outline-danger btn-sm float-end" value="X" />
					</form>
					)}
					<blockquote class="blockquote mb-0">
						<p>{note.text}</p>
						<footer class="blockquote-footer">{note.name}</footer>
					</blockquote>
				</div>
				<div class="card-footer d-flex flex-row justify-content-end">
					<span class="text-muted" title={new Date(note.timestamp as number).toLocaleTimeString()}>{new Date(note.timestamp as number).toLocaleDateString()}</span>
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
					<h1 class="mb-2">Notes</h1>
					<button type="button" class="btn btn-outline-secondary mb-3" data-bs-toggle="modal" data-bs-target="#modal">
						Add Note
					</button>
                    </div>

					<div id="notes">{cards}</div>
				</div>
			</div>
		</div>
	);
});

app.post("/book/:book/note/create", async (c) => {
	const key = getCookie(c, "key");
	const book = await checkAccess(c.env.DB, c.req.param("book"), key);
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

app.post("/book/:book/note/:note/delete", async (c) => {
	const key = getCookie(c, "key");
	const book = await checkAccess(c.env.DB, c.req.param("book"), key);
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



export default app