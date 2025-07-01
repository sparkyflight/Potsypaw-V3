// Packages
import fs from "node:fs";
import path from "path";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import firebase from "firebase-admin";
import serviceAccount from "./firebaseService.js";
import * as database from "./Serendipy/prisma.js";
import * as rpc from "./Serendipy/rpc.js";
import * as auth from "./auth.js";
import * as perms from "./perms.js";
import { logger } from "./logger.js";
import "dotenv/config";

// Firebase init
firebase.initializeApp({
	credential: firebase.credential.cert(
		serviceAccount as firebase.ServiceAccount
	),
});

// Initialize Elysia App
const app = new Elysia()
	.use(
		cors({
			origin: "*",
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: [
				"secret",
				"userid",
				"Authorization",
				"Content-Type",
				"Content-Disposition",
				"Content-Length",
			],
			credentials: true,
		})
	)
	.use(
		swagger({
			documentation: {
				info: {
					title: "Sparkyflight",
					description:
						"Welcome to Sparkyflight, the future of Social Media designed for the neurodiverse community...",
					version: "3.0.0",
				},
				tags: [
					{
						name: "users",
						description:
							"Endpoints for accessing our User database.",
					},
					{
						name: "posts",
						description:
							"Endpoints for accessing our Posts database.",
					},
					{
						name: "partners",
						description: "Endpoints for accessing partner data.",
					},
					{
						name: "@me",
						description:
							"Endpoints for accessing your own personal information.",
					},
					{
						name: "validate",
						description: "Endpoints for validating user data.",
					},
				],
				components: {
					securitySchemes: {
						apiKey: {
							type: "apiKey",
							in: "header",
							name: "Authorization",
						},
					},
				},
				security: [{ apiKey: [] }],
				servers: [
					{
						url:
							process.env.ENV === "production"
								? "http://api.sparkyflight.xyz"
								: `http://localhost:${process.env.PORT}`,
					},
				],
			},
		})
	)
	.onRequest(({ set }) => {
		set.headers["Access-Control-Allow-Origin"] = "*";
		set.headers["Access-Control-Allow-Headers"] = "*";
		set.headers["Access-Control-Allow-Methods"] = "*";
		set.headers["Access-Control-Allow-Credentials"] = "true";
	})
	.onRequest((ctx) => {
		logger.info(
			"Request received: " + ctx.request.method + " " + ctx.request.url
		);
	})
	.onError(({ code, error }) => {
		console.error("Server error:", error);
		if (code === "NOT_FOUND")
			return new Response("Not Found", { status: 404 });
		return new Response("Internal Server Error", { status: 500 });
	});

// Recursively load routes from dist/endpoints
const getFilesInDirectory = (dir: string): string[] => {
	let files: string[] = [];
	for (const file of fs.readdirSync(dir)) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory())
			files = files.concat(getFilesInDirectory(filePath));
		else if (filePath.endsWith(".js")) files.push(filePath);
	}
	return files;
};

const endpoints = getFilesInDirectory("./dist/endpoints");
for (const file of endpoints) {
	const module = await import(path.resolve(file));
	app.use(module.default);
}

// Start Server
app.listen(Number(process.env.PORT));
console.log(
	`🦊 Sparkyflight API is running at http://localhost:${process.env.PORT}`
);
