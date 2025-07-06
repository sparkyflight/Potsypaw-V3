import { Elysia, t } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";
import * as logger from "../../logger.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";

export default new Elysia({
	name: "Create Account",
	detail: {
		summary: "Create Account",
		description:
			"This endpoint allows users to sign up for a new account. It requires an authorization token and a unique usertag.",
		tags: ["Authentication"],
		responses: generateResponses(
			z.object({
				error: z.boolean(),
				message: z.string(),
			}),
			false
		),
	},
}).post(
	"/auth",
	async ({ request, query, set }) => {
		try {
			const authorization = request.headers.get("authorization");
			const { tag, uid } = query;

			if (!authorization) {
				set.status = 401;
				return {
					error: true,
					message: "Missing authorization header.",
				};
			}

			const userInfo = await firebase
				.auth()
				.verifyIdToken(authorization, true);
			const dbUser = await database.Users.get({ userid: userInfo.uid });

			if (dbUser) {
				return {
					error: true,
					message: "[Database Error] => User already exists.",
				};
			}

			const existingUser = await database.Users.get({ usertag: tag });
			if (existingUser) {
				return {
					error: true,
					message:
						"That usertag is already in use. Please choose a new one.",
				};
			}

			const result = await database.Users.createUser({
				name: tag,
				userid: userInfo.uid,
				usertag: tag,
				bio: "None",
				avatar: "/logo.png",
			});

			if (result === true) {
				return {
					error: false,
					message: "User Created.",
				};
			} else {
				return {
					error: true,
					message: result,
				};
			}
		} catch (error) {
			set.status = 500;
			logger.error("Error during user signup", error);

			return {
				error: "Internal Server Error",
				message: "An error occurred while processing your request.",
			};
		}
	},
	{
		query: t.Object({
			tag: t.String(),
			uid: t.String(),
		}),
	}
);
