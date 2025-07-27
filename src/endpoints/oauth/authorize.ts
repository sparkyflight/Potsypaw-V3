import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";
import { getStackSession, StackAuthSessionData } from "../../lib.js";

export default new Elysia({
	name: "Authorize Application",
	detail: {
		summary: "Authorize an OAuth app",
		description:
			"Creates a token for an application after user grants access.",
		tags: ["Public oAuth"],
		responses: generateResponses(
			z.object({
				token: z.string(),
			})
		),
	},
}).post(
	"/oauth/authorize",
	async ({ request, set }) => {
		const authorization = request.headers.get("Authorization");

		if (!authorization) {
			set.status = 401;
			return {
				error: true,
				message: "Missing authorization header.",
			};
		}

		const body = await request.json();
		const { application_id, scopes } = body;

		if (!application_id || !Array.isArray(scopes)) {
			set.status = 400;
			return {
				error: true,
				message: "Missing application_id or scopes.",
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

			const dbUser = await database.Users.get({
				userid: stackAuth?.id,
			});
			if (!dbUser) {
				set.status = 404;
				return {
					error: true,
					message: "User not found.",
				};
			}

			const token = await database.Applications.authorizeApp(
				dbUser.userid,
				application_id,
				scopes,
				null
			);

			if (token instanceof Error) {
				set.status = 500;
				return {
					error: true,
					message: token.message,
				};
			}

			return { token };
		} catch (err: any) {
			set.status = 500;
			return {
				error: true,
				message: err?.message || "Internal server error.",
			};
		}
	},
	{
		body: t.Object({
			application_id: t.String(),
			scopes: t.Array(t.String()),
		}),
	}
);
