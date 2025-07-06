import { Elysia, t } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";
import * as logger from "../../logger.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";

export default new Elysia({
	name: "Auth Callback",
	detail: {
		summary: "Authentication Callback",
		description:
			"This returns a value in which you should use to make further API Requests.",
		tags: ["Authentication"],
		responses: generateResponses(
			z.object({
				token: z.string(),
			}),
			false
		),
	},
}).get("/auth", async ({ request, set }) => {
	try {
		const authorization = request.headers.get("authorization");

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

		const dbUser = await database.prisma.users.findUnique({
			where: {
				userid: userInfo.uid,
			},
			include: {
				posts: true,
				applications: false,
				followers: {
					include: {
						user: false,
						target: true,
					},
				},
				following: {
					include: {
						user: false,
						target: true,
					},
				},
			},
		});

		if (dbUser) {
			return { token: authorization };
		} else {
			return {
				token: authorization,
				error: true,
				message: "User does not exist.",
			};
		}
	} catch (error) {
		set.status = 500;
		logger.error("Error during authentication callback", error);

		return {
			error: "Internal Server Error",
			message: "An error occurred while processing your request.",
		};
	}
});
