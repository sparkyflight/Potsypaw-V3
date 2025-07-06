import { Elysia, t, Static } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { z } from "zod";
import { generateResponses } from "../../scripts/load-schema.js";

const bodySchema = t.Object({
	post_id: t.String(),
});

export default new Elysia({
	name: "Delete Post",
	detail: {
		summary: "Delete Post",
		description:
			"This endpoint allows you to delete a post by providing the Post ID. You must be the author of the post to delete it.",
		tags: ["Posts"],
		responses: generateResponses(
			z.object({
				success: z.boolean(),
			}),
			false
		),
	},
}).delete(
	"/posts",
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
			return { error: "Oops, it seems that you are not logged in." };
		}

		if (!body.post_id) {
			set.status = 400;
			return {
				error: "Oops, it seems that you did not pass the Post ID.",
			};
		}

		const user = await getAuth(authorization, "posts.delete");

		if (!user) {
			set.status = 401;
			return {
				success: false,
				error: "The user token was not passed with token.",
			};
		}

		const origPost = await database.Posts.get(body.post_id);

		if (!origPost) {
			set.status = 404;
			return {
				success: false,
				error: "The Post ID provided is invalid.",
			};
		}

		if (origPost.userid !== user.userid) {
			return {
				success: false,
				error: "You are NOT the author of this post. Access denied.",
			};
		}

		await database.Posts.delete(origPost.postid);

		return { success: true };
	},
	{
		body: bodySchema,
	}
);
