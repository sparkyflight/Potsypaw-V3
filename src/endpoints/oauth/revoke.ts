import { Elysia } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";

export default new Elysia({
	name: "Revoke Token",
	detail: {
		summary: "Revoke an OAuth token",
		description: "Revokes an existing access token.",
		tags: ["Public oAuth"],
		responses: generateResponses(
			z.object({
				success: z.boolean(),
				message: z.string(),
			})
		),
	},
}).post("/oauth/revoke", async ({ request, set }) => {
	const token = request.headers.get("Authorization");

	if (!token) {
		set.status = 401;
		return { error: true, message: "Missing token" };
	}

	const result = await database.Applications.revokeToken(token);
	if (result instanceof Error) {
		set.status = 500;
		return { error: true, message: result.message };
	}

	return { success: true, message: "Token revoked." };
});
