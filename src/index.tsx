import { Hono } from "hono";
import { renderer } from "./renderer";
import api from "./api";
import { NotebookAccess, NotebookError, accessBook, checkAccess } from "./db";
import { Bindings } from "./global";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import router_book from "@/book"
import router_create from "@/create"


const app = new Hono<{ Bindings: Bindings }>();

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
app.route("/", router_book)
app.route("/", router_create)













export default app;
