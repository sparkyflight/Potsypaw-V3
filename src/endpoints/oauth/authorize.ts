import { Elysia, t } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";

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
			const userInfo = await firebase
				.auth()
				.verifyIdToken(authorization, true);

			const dbUser = await database.Users.get({ userid: userInfo.uid });
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
