import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";

const querySchema = t.Object({
	target: t.String(),
	type: t.Enum({ follow: "follow", unfollow: "unfollow" }),
});

export default new Elysia({
	name: "Follow User",
	detail: {
		summary: "Follow or Unfollow a User",
		description:
			"This endpoint allows you to follow or unfollow a user. You must provide a valid authorization token in the request header and specify the target user ID and action type (follow or unfollow).",
		tags: ["Users"],
	},
}).put(
	"/users/follow",
	async ({ query, request, set }) => {
		const authorization = request.headers.get("authorization");
		if (!authorization) {
			set.status = 401;
			return { error: "Missing authorization header." };
		}

		const user = await getAuth(authorization, "users.follow");
		if (!user) {
			set.status = 401;
			return { error: "Invalid user token or user does not exist." };
		}

		const target = await database.Users.get({ userid: query.target });
		if (!target) {
			set.status = 404;
			return { error: "The provided target user id is invalid." };
		}

		if (query.type === "follow") {
			if (user.following.find((p) => p.targetid === target.userid)) {
				return { error: "You cannot follow this user again." };
			}

			const update = await database.Users.follow(
				user.userid,
				target.userid
			);
			if (!update) {
				return {
					error: "An unexpected error occurred while trying to complete your request.",
				};
			}

			return { success: true };
		} else {
			// unfollow
			if (!user.following.find((p) => p.targetid === target.userid)) {
				return {
					error: "You cannot unfollow this user because you are not following them.",
				};
			}

			const update = await database.Users.unfollow(
				user.userid,
				target.userid
			);
			if (!update) {
				return {
					error: "An unexpected error occurred while trying to complete your request.",
				};
			}

			return { success: true };
		}
	},
	{
		query: querySchema,
		response: {
			200: t.Object({
				success: t.Boolean(),
			}),
			401: t.Object({
				error: t.String(),
			}),
			404: t.Object({
				error: t.String(),
			}),
		},
	}
);
