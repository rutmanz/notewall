import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children, title, js, meta }) => {
	return (
		<html data-bs-theme="dark">
			<head>
				<link href="/static/style.css" rel="stylesheet" />
				<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous"></link>
				<script async defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
				{js && <script async defer src={"/static/" + js + ".js"}></script>}
				<title>{title}</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{meta && (
					<>
					<meta property="og:title" content={meta.title ?? title} />
					<meta property="og:description" content={meta.description} />
					<meta property="og:image" content={meta.image} />
					<meta property="og:image:alt" content={meta.image_alt} />
					<meta name="twitter:card" content="summary" />
					<meta name="twitter:title" value={meta.title ?? title} />
					<meta name="twitter:description" value={meta.description} />
					<meta name="twitter:image" value={meta.image} />
					<meta name="twitter:image:alt" value={meta.image_alt} />
					<meta name="twitter:label1" value={meta.label1} />
					<meta name="twitter:data1"  value={meta.value1} />
					<meta name="twitter:label2" value={meta.label2} />
					<meta name="twitter:data2"  value={meta.value2} />
					</>
				)}
			</head>
			<body>{children}</body>
		</html>
	);
});
