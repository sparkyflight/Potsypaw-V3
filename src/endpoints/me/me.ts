import { Elysia, t } from "elysia";
import { getAuth } from "../../auth.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

export default new Elysia({
	name: "Get @me",
	detail: {
		summary: "Get Authenticated User's Profile",
		description:
			"This endpoint retrieves the profile information of the authenticated user. You must provide a valid authorization token in the request header.",
		tags: ["My Profile"],
	},
}).get(
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
	},
	{
		response: {
			200: prismaSchema.components.schemas.users as any,
			401: t.Object({
				error: t.Boolean(),
				message: t.String(),
			}),
			404: t.Object({
				error: t.Boolean(),
				message: t.String(),
				token: t.String(),
			}),
		},
	}
);
