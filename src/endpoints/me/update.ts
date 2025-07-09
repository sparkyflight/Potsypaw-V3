import { Elysia, Static, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";

const bodySchema = t.Object({
	name: t.Optional(t.String()),
	tag: t.Optional(t.String()),
	avatar: t.Optional(t.String()),
	banner: t.Optional(t.String()),
	bio: t.Optional(t.String()),
	interests: t.Optional(t.Array(t.String)),
	discord: t.Optional(t.String()),
});

export default new Elysia({
	name: "Update @me",
	detail: {
		summary: "Update Authenticated User's Profile",
		description:
			"This endpoint allows you to update your user profile information. You must provide a valid authorization token in the request header.",
		tags: ["My Profile"],
		responses: generateResponses(
			z.object({
				success: z.string(),
			}),
			false
		),
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
		const name = body.name?.trim() || null;
		const tag = body.tag?.trim() || null;
		const avatar = body.avatar?.trim() || null;
		const banner = body.banner?.trim() || null;
		const bio = body.bio?.trim() || null;
		const interests = body.interests || [];
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
			name: name,
			usertag: tag,
			avatar: avatar,
			banner: banner,
			bio: bio,
			specialInterests: interests,
			discord_id: discord,
		});

		return {
			success: true,
		};
	},
	{
		body: bodySchema,
	}
);
