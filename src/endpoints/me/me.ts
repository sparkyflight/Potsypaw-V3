import { Elysia } from "elysia";
import { getAuth } from "../../auth.js";

export default new Elysia({ name: "users/@me" }).get(
	"/users/@me",
	async ({ request, set }) => {
		const authorization = request.headers.get("authorization");

		if (!authorization) {
			set.status = 401;
			return {
				error: true,
				message: "Missing authorization header.",
			};
		}

		const user = await getAuth(authorization, "profile.read");

		if (user) {
			return user;
		} else {
			set.status = 404;
			return {
				error: true,
				message:
					"We couldn't fetch any information about you in our database",
				token: authorization,
			};
		}
	}
);
