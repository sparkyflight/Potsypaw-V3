// Packages
import fs from "node:fs";
import firebase from "firebase-admin";
import serviceAccount from "./firebaseService.js";
import path from "path";
import * as database from "./Serendipy/prisma.js";
import * as rpc from "./Serendipy/rpc.js";
import * as auth from "./auth.js";
import * as perms from "./perms.js";
import cors from "@fastify/cors";
import ratelimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import ui from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";
import { logger } from "./logger.js";

// Initialize Firebase Admin
firebase.initializeApp({
	credential: firebase.credential.cert(
		serviceAccount as firebase.ServiceAccount
	),
});

// Middleware
const app: FastifyInstance = Fastify({
	logger: logger,
});

app.register(cors, {
	origin: "*",
	allowedHeaders: [
		"secret",
		"userid",
		"Authorization",
		"Authorization",
		"Content-Type",
		"Content-Disposition",
		"Content-Length",
	],
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	credentials: true,
	optionsSuccessStatus: 200,
	preflight: true,
	strictPreflight: false,
});

app.register(swagger, {
	swagger: {
		info: {
			title: "Sparkyflight",
			description:
				"Welcome to Sparkyflight, the future of Social Media designed for the neurodiverse community, with a primary focus on individuals on the Autism Spectrum. Sparkyflight aims to provide a safe and inclusive space for people to connect, learn, and communicate about their special interests. Our platform utilizes a machine learning algorithm to match users based on their unique passions, creating a supportive network for shared education.",
			version: "3.0.0",
		},
		host:
			process.env.ENV === "production"
				? "api.sparkyflight.xyz"
				: `localhost:${process.env.PORT}`,
		schemes: ["http"],
		consumes: ["application/json"],
		produces: ["application/json"],
		tags: [
			{
				name: "users",
				description: "Endpoints for accessing our User database.",
			},
			{
				name: "posts",
				description: "Endpoints for accessing our Posts database.",
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
				description:
					"Endpoints for validating user data before continuing API Use.",
			},
		],
		securityDefinitions: {
			apiKey: {
				type: "apiKey",
				name: "Authorization",
				in: "header",
			},
		},
	},
	hideUntagged: false,
});

app.register(ui, {
	routePrefix: "/",
	uiConfig: {
		docExpansion: "full",
		deepLinking: true,
	},
	uiHooks: {
		onRequest: (request, reply, next) => {
			next();
		},
		preHandler: (request, reply, next) => {
			next();
		},
	},
	staticCSP: true,
	transformStaticCSP: (header) => header,
	transformSpecification: (swaggerObject, request, reply) => {
		return swaggerObject;
	},
	transformSpecificationClone: true,
});

app.register(ratelimit, {
	global: true,
	max: 50,
	timeWindow: 1000,
});

app.addHook("preHandler", (req, res, done) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	res.header("Access-Control-Allow-Methods", "*");
	res.header("Access-Control-Allow-Credentials", "true");

	done();
});

// API Endpoints Map
const getFilesInDirectory = (dir: string) => {
	let files: string[] = [];
	const filesInDir = fs.readdirSync(dir);

	for (const file of filesInDir) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory())
			files = files.concat(getFilesInDirectory(filePath));
		else files.push(filePath);
	}

	return files;
};

// API Endpoints
const apiEndpointsFiles = getFilesInDirectory("./dist/endpoints").filter(
	(file) => file.endsWith(".js")
);

for (const file of apiEndpointsFiles) {
	import(`../${file}`)
		.then(async (module) => {
			await app.route(module.default);
		})
		.catch((error) => {
			console.error(`Error importing ${file}: ${error}`);
		});
}

setTimeout(() => {
	// Swagger
	app.ready(() => {
		app.swagger();
	});

	// Start Server
	app.listen({ port: Number(process.env.PORT) }, (err) => {
		if (err) throw err;
	});
}, 8000);
