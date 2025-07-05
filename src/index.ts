// Packages
import fs from "node:fs";
import path from "path";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import firebase from "firebase-admin";
import * as database from "./Serendipy/prisma.js";
import * as rpc from "./Serendipy/rpc.js";
import * as auth from "./auth.js";
import * as perms from "./perms.js";
import { info, error as err } from "./logger.js";
import fixedSchema from "./schemas/PrismaTypes.schema.json" with { type: "json" };
import "dotenv/config";

// Firebase init
firebase.initializeApp({
	credential: firebase.credential.cert({
		type: process.env.TYPE || "",
		project_id: process.env.PROJECT_ID || "",
		private_key_id: process.env.PRIVATE_KEY_ID || "",
		private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
		client_email: process.env.CLIENT_EMAIL || "",
		client_id: process.env.CLIENT_ID || "",
		auth_uri: process.env.AUTH_URI || "",
		token_uri: process.env.TOKEN_URI || "",
		auth_provider_x509_cert_url:
			process.env.AUTH_PROVIDER_X509_CERT_URL || "",
		client_x509_cert_url: process.env.CLIENT_X509_CERT_URL || "",
		universe_domain: process.env.UNIVERSE_DOMAIN || "",
	} as firebase.ServiceAccount),
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
						"Sparkyflight isn't your typical social media network. It's a digital haven crafted specifically for the neurodiverse — especially autistic individuals — to express themselves, connect meaningfully, and explore their favorite subjects in a calm, structured, and supportive space.",
					version: "3.0.0",
					termsOfService: "https://purrquinox.com/terms",
					contact: {
						name: "Purrquinox",
						url: "https://purrquinox.com",
						email: "contact@purrquinox.com",
					},
					license: {
						name: "MIT License",
						url: "https://opensource.org/license/mit/",
					},
				},
				tags: [
					{
						name: "Root",
						description: "Endpoints for accessing API Statistics.",
					},
					{
						name: "Users",
						description:
							"Endpoints for accessing our User database.",
					},
					{
						name: "Posts",
						description:
							"Endpoints for accessing our Posts database.",
					},
					{
						name: "Partners",
						description: "Endpoints for accessing partner data.",
					},
					{
						name: "Applications",
						description:
							"Endpoints for managing developer applications.",
					},
					{
						name: "My Profile",
						description:
							"Endpoints for accessing your own personal information.",
					},
					{
						name: "Authentication",
						description:
							"Endpoints for user authentication and authorization.",
					},
					{
						name: "Input Validation",
						description: "Endpoints for validating user data.",
					},
					{
						name: "RPC [Remote Procedure Call]",
						description:
							"Coming Soon! *These endpoints are only available to staff.*",
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
					schemas: fixedSchema.definitions as any,
				},
				security: [{ apiKey: [] }],
				servers: [
					{
						url: "https://potsypaw.sparkyflight.xyz",
						description: "Production Server",
					},
					{
						url: "https://potsypaw-staging.sparkyflight.xyz",
						description: "Staging Server",
					},
					{
						url: "http://localhost:5590",
						description: "Local Development Server",
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
