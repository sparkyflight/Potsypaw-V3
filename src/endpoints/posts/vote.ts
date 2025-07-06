import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { z } from "zod";
import { generateResponses } from "../../scripts/load-schema.js";

const querySchema = t.Object({
	PostID: t.String(),
	type: t.Enum({ up: "up", down: "down" }),
});

export default new Elysia({
	name: "Vote for a Post",
	detail: {
		summary: "Vote for a Post",
		description:
			"This endpoint allows you to vote for a post. You must provide a valid authorization token in the request header and specify the Post ID and vote type (up or down).",
		tags: ["Posts"],
		responses: generateResponses(
			z.object({
				success: z.boolean(),
			}),
			false
		),
	},
}).put(
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
