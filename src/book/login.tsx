import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Bindings } from "@/global";
import { checkAccess, NotebookError, NotebookAccess, createToken, getBook } from "@/db";
import { renderErrorPage } from "@/renderer";

const app = new Hono<{ Bindings: Bindings }>().basePath("/book/:book");

app.get("/login", async (c) => {
	const book = await getBook(c.env, c.req.param("book"));
	if (book == null) {
		c.status(400)
		return c.render(renderErrorPage("Book could not be found"));
	}
	return c.render(
		<div class="container d-flex flex-column justify-content-center" style="min-height:100vh">
			<div class="row">
				<div class="col-10 col-lg-6 mx-auto">
					<h1 style="margin-bottom:3rem;">Sign into {book.title}</h1>
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

	const book = await checkAccess(c.env, c.req.param("book"), key);

	if (book.access != NotebookAccess.NONE) {
		const token = await createToken(c.env, c.req.param("book"), key!);
		setCookie(c, "token", token.token!, { path: `/book/${c.req.param("book")}`, httpOnly: true, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
		return c.redirect(`/book/${c.req.param("book")}`);
	}
	return c.redirect(`/book/${c.req.param("book")}/login`);
});

app.get("/logout", async (c) => {
	deleteCookie(c, "token", { path: `/book/${c.req.param("book")}` });
	return c.redirect(`/`);
});

export default app