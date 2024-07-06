import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Bindings } from "@/global";
import { checkAccess, NotebookError, NotebookAccess } from "@/db";

const app = new Hono<{ Bindings: Bindings }>().basePath("/book/:book");

app.get("/login", async (c) => {
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

app.post("/login", async (c) => {
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

app.get("/logout", async (c) => {
	deleteCookie(c, "key", { path: `/book/${c.req.param("book")}` });
	return c.redirect(`/`);
});

export default app