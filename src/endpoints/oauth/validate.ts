import { Elysia } from "elysia";
import * as database from "../../Serendipy/prisma.js";

export default new Elysia({
	name: "Validate Token",
	detail: {
		summary: "Validate an OAuth token",
		description: "Checks if the token is valid, not expired or revoked.",
		tags: ["Public oAuth"],
	},
}).get("/oauth/validate", async ({ request, set }) => {
	const token = request.headers.get("Authorization");

	if (!token) {
		set.status = 401;
		return { error: true, message: "Missing token" };
	}

	const session = await database.Applications.validateToken(token);
	if (!session) {
		set.status = 403;
		return { error: true, message: "Invalid or expired token." };
	}

	return {
		user: session.authorized_user,
		application: session.application,
		scopes: session.scopes,
	};
});
