import { Elysia } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import * as logger from "../../logger.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";
import { getStackSession, StackAuthSessionData } from "../../lib.js";

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

		let stackAuth: StackAuthSessionData;
		const stackSessionResult = await getStackSession(authorization);
		if (
			stackSessionResult &&
			typeof stackSessionResult === "object" &&
			"id" in stackSessionResult
		) {
			stackAuth = stackSessionResult as StackAuthSessionData;
		} else stackAuth = undefined as any;

		const dbUser = await database.prisma.users.findUnique({
			where: {
				userid: stackAuth?.server_metadata.uid,
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
