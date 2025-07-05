import { Elysia, Static, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";

const bodySchema = t.Object({
	name: t.String(),
	tag: t.String(),
	avatar: t.String(),
	bio: t.Optional(t.String()),
	discord: t.Optional(t.String()),
});

export default new Elysia({
	name: "Update @me",
	detail: {
		summary: "Update Authenticated User's Profile",
		description:
			"This endpoint allows you to update your user profile information. You must provide a valid authorization token in the request header.",
		tags: ["My Profile"],
	},
}).patch(
	"/users/@me",
	async ({
		request,
		body,
		set,
	}: {
		request: Request;
		body: Static<typeof bodySchema>;
		set: any;
	}) => {
		const authorization = request.headers.get("authorization");

		if (!authorization) {
			set.status = 401;
			return {
				error: true,
				message: "Missing authorization header.",
			};
		}

		const user = await getAuth(authorization, "profile.write");

		if (!user) {
			set.status = 404;
			return {
				error: true,
				message:
					"We couldn't fetch any information about you in our database",
				token: authorization,
			};
		}

		// Normalize optional fields
		const bio = body.bio?.trim() || null;
		const tag = body.tag?.trim() || null;
		const discord = body.discord?.trim() || null;

		if (tag && user.usertag !== tag) {
			const existingUser = await database.Users.get({ usertag: tag });

			if (existingUser) {
				return {
					success: false,
					message:
						"That usertag is already in use. Please choose a new one.",
				};
			}
		}

		await database.Users.updateUser(user.userid, {
			name: body.name,
			usertag: tag,
			avatar: body.avatar,
			bio,
			discord_id: discord,
		});

		return {
			success: true,
		};
	},
	{
		body: bodySchema,
		response: {
			200: t.Object({
				success: t.Boolean(),
			}),
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
