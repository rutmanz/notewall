import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children, title, js }) => {
	return (
		<html data-bs-theme="dark">
			<head>
				<link href="/static/style.css" rel="stylesheet" />
				<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous"></link>
				<script async defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
				{js && <script async defer src={"/static/" + js + ".js"}></script>}
				<title>{title}</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>{children}</body>
		</html>
	);
});
