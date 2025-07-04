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
import { info, error as err } from "./logger.js";
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
	.onRequest((ctx) => {
		info(
			"Elysia",
			"Request received: " + ctx.request.method + " " + ctx.request.url
		);
	})
	.onError(({ code, error }) => {
		let errorMsg: string;
		if (typeof error === "object" && error !== null) {
			if ("summary" in error && typeof error.summary === "string")
				errorMsg = error.summary;
			else if ("message" in error && typeof error.message === "string")
				errorMsg = error.message;
			else if (
				"errors" in error &&
				Array.isArray(error.errors) &&
				error.errors.length > 0
			) {
				const first = error.errors[0];
				errorMsg =
					typeof first.summary === "string"
						? first.summary
						: typeof first.message === "string"
						? first.message
						: JSON.stringify(first, null, 2);
			} else errorMsg = JSON.stringify(error, null, 2);
		} else errorMsg = String(error);

		err("Elysia", `Error occurred: ${errorMsg}`);

		if (code === "NOT_FOUND")
			return new Response("Not Found", { status: 404 });
		return new Response(String(error), { status: 500 });
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
app.listen(
	{
		hostname: "0.0.0.0",
		port: Number(process.env.PORT),
	},
	() => {
		info(
			"Elysia",
			`🦊 Sparkyflight API is running at http://localhost:${process.env.PORT}`
		);
	}
);
