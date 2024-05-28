import { Hono } from "hono";
import { renderer } from "./renderer";
import api from "./api";
import { NotebookAccess, NotebookError, accessBook, checkAccess } from "./db";
import { Bindings } from "./global";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

const app = new Hono<{ Bindings: Bindings }>();
app.use(async (c, next) => {
	// console.log(c.req)
	await next();
});
app.use(renderer);

app.get("/", (c) => {
	return c.render(
		<div class="container d-flex flex-column justify-content-center" style="min-height:100vh">
			<div class="row">
				<div class="col-10 col-lg-6 mx-auto text-center">
					<h1>Hello</h1>
				</div>
			</div>
		</div>
	);
});

app.route("/api", api);

app.get("/create", async (c) => {
	return c.render(
		<div class="container d-flex flex-column justify-content-center" style="min-height:100vh">
			<div class="row">
				<div class="col-10 col-lg-8 mx-auto">
					<h1 style="margin-bottom:3rem;">Create Book</h1>
					<form class="needs-validation" novalidate name="create" method="post">
						<div class="mb-4">
							<label for="idInput" class="form-label">
								Form ID
							</label>
							<input type="text" class="form-control slug-validate" name="id" id="idInput" aria-describedby="idHelp" placeholder="" required />
							<div id="idHelp" class="form-text">
								This will be used in the URL
							</div>
							<div class="valid-feedback">Looks good!</div>
							<div class="invalid-feedback">Please only use letters, numbers, and hyphens.</div>
						</div>
						<div class="mb-4">
							<label for="titleInput" class="form-label">
								Title
							</label>
							<input type="text" class="form-control" name="title" id="titleInput" aria-describedby="titleHelp" placeholder="" required />
							<div class="invalid-feedback">Please create a title.</div>
						</div>
						<div class="mb-4">
							<label for="keyInput" class="form-label">
								Password
							</label>
							<input type="text" class="form-control" name="key" id="keyInput" aria-describedby="keyHelp" placeholder="" required />
							<div id="keyHelp" class="form-text">
								This will be used to access the note book
							</div>
							<div class="invalid-feedback">Please create a password.</div>
						</div>
						<div class="mb-4">
							<label for="keyInput" class="form-label">
								Admin Password
							</label>
							<input type="text" class="form-control" name="key" id="keyInput" aria-describedby="keyHelp" placeholder="" required />
							<div id="keyHelp" class="form-text">
								This will be used to manage the note book
							</div>
							<div class="invalid-feedback">Please create an admin password.</div>
						</div>

						<button type="submit" class="btn btn-success" style="width:100%">
							Create
						</button>
					</form>
				</div>
			</div>
		</div>,
		{ title: "Create Book", js: "create" }
	);
});

app.get("/api/isValidBook", async (c) => {
	const id = c.req.query().id;
	const book = await checkAccess(c.env.DB, id, "");
	return c.json({ valid: book.error == NotebookError.INVALID_BOOK });
});

app.post("/create", async (c) => {
	const data = await c.req.formData();
	if (!data.has("id")) {
		return c.text("Please provide an identifier.", 400);
	}
	if (!data.has("title")) {
		return c.text("Please provide a title.", 400);
	}
	if (!data.has("key")) {
		return c.text("Please provide a key.", 400);
	}
	if (!data.has("admin_key")) {
		return c.text("Please provide an admin key.", 400);
	}
	const id = data.get("id");
	const title = data.get("title");
	const key = data.get("key");
	const admin_key = data.get("admin_key");
	const book = await checkAccess(c.env.DB, id, "");
	if (book.error == NotebookError.INVALID_BOOK) {
		await c.env.DB.prepare("INSERT INTO books (id, title, key, admin_key) VALUES (?,?,?,?)").bind(id, title, key, admin_key).run();
		return c.redirect(`/book/${id}`);
	} else {
		return c.text("Book already exists.", 400);
	}
});
app.post("/book/:book/note", async (c) => {
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

app.get("/book/:book", async (c) => {
	const key = getCookie(c, "key");
	const book = await checkAccess(c.env.DB, c.req.param("book"), key);
	if (book.error == NotebookError.INVALID_BOOK) {
		return c.text("Book could not be found", 404);
	}
	if (book.access == NotebookAccess.NONE) {
		return c.redirect(`/book/${c.req.param("book")}/login`);
	}

	const notes = await c.env.DB.prepare("SELECT name, text, timestamp FROM quotes WHERE book=? ORDER BY timestamp DESC").bind(c.req.param("book")).all();
	const cards = notes.results.map((note) => {
		return (
			<div class="card mb-2">
				<div class="card-body">
					<blockquote class="blockquote mb-0">
						<p>{note.text}</p>
						<footer class="blockquote-footer">{note.name}</footer>
					</blockquote>
				</div>
				<div class="card-footer d-flex flex-row justify-content-end">
					<span class="text-muted">{new Date(note.timestamp as number).toLocaleDateString()}</span>
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
						<form action={`/book/${c.req.param("book")}/note`} target="_self" method="post">
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
					<h1 class="mb-2">Notes</h1>
					{/* <!-- Button trigger modal --> */}
					<button type="button" class="btn btn-outline-secondary mb-3" data-bs-toggle="modal" data-bs-target="#modal">
						Add Note
					</button>
					
					<button type="button" class="btn btn-outline-secondary mb-3" data-bs-toggle="modal" data-bs-target="#modal">
						Admin
					</button>

					<div id="notes">{cards}</div>
				</div>
			</div>
		</div>
	);
});

app.get("/book/:book/login", async (c) => {
	const key = getCookie(c, "key");
	const book = await checkAccess(c.env.DB, c.req.param("book"), key);
	if (book.error == NotebookError.INVALID_BOOK) {
		return c.text("Book could not be found", 404);
	}
	return c.render(
		<div class="container d-flex flex-column justify-content-center" style="min-height:100vh">
			<div class="row">
				<div class="col-10 col-lg-6 mx-auto">
					<h1 style="margin-bottom:3rem;">Sign into {book.data!.title}</h1>
					<form name="login" method="post">
						<div class="mb-3">
							<div class="input-group">
								<input id="key" class="form-control" type="password" name="key" placeholder="Enter Password..." />
								<button type="submit" class="btn btn-primary">
									Submit
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
});

app.post("/book/:book/login", async (c) => {
	const data = await c.req.formData();
	const key = data.get("key");
	const book = await checkAccess(c.env.DB, c.req.param("book"), key);
	// console.log(await c.env.DB.prepare("SELECt * FROM notes").run())
	if (book.access != NotebookAccess.NONE) {
		setCookie(c, "key", key!, { path: `/book/${c.req.param("book")}`, httpOnly: true, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
		return c.redirect(`/book/${c.req.param("book")}`);
	}
	return c.redirect(`/book/${c.req.param("book")}/login`);
});

app.get("/book/:book/logout", async (c) => {
	deleteCookie(c, "key", { path: `/book/${c.req.param("book")}` });
	return c.redirect(`/`);
});

export default app;
