import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { z } from "zod";
import { generateResponses } from "../../scripts/load-schema.js";

const querySchema = t.Object({
	PostID: t.String(),
});

export default new Elysia({
	name: "Unvote Post",
	detail: {
		summary: "Unvote Post",
		description:
			"This endpoint allows you to remove your vote for a post. You must provide a valid authorization token in the request header and specify the Post ID.",
		tags: ["Posts"],
		responses: generateResponses(
			z.object({
				success: z.boolean(),
			}),
			false
		),
	},
}).delete(
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

		const { PostID } = query;

		const post = await database.Posts.get(PostID);
		if (!post) {
			set.status = 404;
			return { error: "The provided post id is invalid." };
		}

		const hasVoted =
			post.upvotes.some((a) => a.userid === user.userid) ||
			post.downvotes.some((a) => a.userid === user.userid);

		if (hasVoted) {
			const update = await database.Posts.unvote(PostID, user.userid);
			if (!update) {
				return {
					error: "An unexpected error occurred while trying to complete your request.",
				};
			}

			return { success: true };
		} else {
			return {
				error: "User did not vote for this post.",
			};
		}
	},
	{
		query: querySchema,
	}
);
