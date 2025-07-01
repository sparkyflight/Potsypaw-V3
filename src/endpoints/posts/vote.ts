import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";

const querySchema = t.Object({
	PostID: t.String(),
	type: t.Enum({ up: "up", down: "down" }),
});

export default new Elysia({ name: "posts/vote" }).put(
	"/posts/vote",
	async ({ request, query, set }) => {
		const authorization = request.headers.get("authorization");
		if (!authorization) {
			set.status = 401;
			return { error: "Missing authorization header." };
		}

		const user = await getAuth(authorization, "posts.vote");
		if (!user) {
			set.status = 401;
			return { error: "Invalid user token or user does not exist." };
		}

		const { PostID, type } = query;

		const post = await database.Posts.get(PostID);
		if (!post) {
			set.status = 404;
			return { error: "The provided post id is invalid." };
		}

		const hasVoted =
			post.upvotes.some((a) => a.userid === user.userid) ||
			post.downvotes.some((a) => a.userid === user.userid);

		if (hasVoted) {
			return { error: "You cannot update your vote for this post." };
		}

		const update =
			type === "up"
				? await database.Posts.upvote(PostID, user.userid)
				: await database.Posts.downvote(PostID, user.userid);

		if (!update) {
			return {
				error: "An unexpected error occurred while trying to complete your request.",
			};
		}

		return { success: true };
	},
	{
		query: querySchema,
	}
);
