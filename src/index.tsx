import { Hono } from "hono";
import { renderer, renderErrorPage } from "./renderer";
import api from "./api";
import { NotebookAccess, NotebookError, accessBook, checkAccess } from "./db";
import { Bindings } from "./global";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import router_book from "@/book";
import router_create from "@/create";

const app = new Hono<{ Bindings: Bindings }>();

app.use(renderer);

app.get("/", (c) => {
	return c.render(
		<div class="container d-flex flex-column justify-content-center" style="min-height:100vh">
			<div class="row">
				<div class="col-10 col-lg-6 mx-auto text-center">
					<h1>Hello</h1>
					<a href="/create" class="btn btn-success">
						Create Book
					</a>
					<div class="input-group mb-3 mt-5">
						<input id="input" type="text" class="form-control" placeholder="Book ID..." aria-label="Book ID" aria-describedby="basic-addon2"></input>
						<div class="input-group-append">
							<button onclick="window.location.href = '/book/' + document.getElementById('input').value" class="btn btn-outline-secondary" type="button">
								Open
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

app.route("/api", api);
app.route("/", router_book);
app.route("/", router_create);

app.get("*", (c) => {
	return c.render(renderErrorPage("Page not found", "Error 404"));
})

export default app;
