import { Elysia } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { z } from "zod";
import { generateResponses } from "../../scripts/load-schema.js";
import { getStackSession, StackAuthSessionData } from "../../lib.js";

export default new Elysia({
	name: "Delete @me",
	detail: {
		summary: "Delete Account",
		description:
			"This endpoint allows you to delete your account. You must provide a valid authorization token in the request header.",
		tags: ["My Profile"],
		responses: generateResponses(
			z.object({
				success: z.boolean(),
			}),
			false
		),
	},
}).delete("/users/@me", async ({ request, set }) => {
	const authorization = request.headers.get("authorization");

	if (!authorization) {
		set.status = 401;
		return {
			error: true,
			message: "Missing authorization header.",
		};
	}

	try {
		let stackAuth: StackAuthSessionData;
		const stackSessionResult = await getStackSession(authorization);
		if (
			stackSessionResult &&
			typeof stackSessionResult === "object" &&
			"id" in stackSessionResult
		) {
			stackAuth = stackSessionResult as StackAuthSessionData;
		} else stackAuth = undefined as any;

		const user = await database.Users.get({
			userid: stackAuth?.id,
		});

		if (!user) {
			set.status = 404;
			return {
				error: true,
				message:
					"We couldn't fetch any information about you in our database",
				token: authorization,
			};
		}

		await database.Users.delete(stackAuth?.id);

		return { success: true };
	} catch (error: any) {
		set.status = 500;
		return {
			error: true,
			message: error?.message || "An unexpected error occurred",
		};
	}
});
