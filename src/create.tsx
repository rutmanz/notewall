import { Bindings } from "@/global";
import { checkAccess, hash, NotebookError } from "@/db";
import { Hono } from "hono";

const app = new Hono<{ Bindings: Bindings }>();

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
	const key = await hash(data.get("key")!);
	const admin_key = await hash(data.get("admin_key")!);
	const book = await checkAccess(c.env.DB, id, "");
	if (book.error == NotebookError.INVALID_BOOK) {
		await c.env.DB.prepare("INSERT INTO books (id, title, key, admin_key) VALUES (?,?,?,?)").bind(id, title, key, admin_key).run();
		return c.redirect(`/book/${id}`);
	} else {
		return c.text("Book already exists.", 400);
	}
});

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
							<input type="text" class="form-control" name="admin_key" id="keyInput" aria-describedby="keyHelp" placeholder="" required />
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
export default app