import { Elysia, t, Static } from "elysia";
import * as database from "../../Serendipy/prisma.js";

const querySchema = t.Object({
	post_id: t.String(),
});

export default new Elysia({ name: "posts/get" }).get(
	"/posts/get",
	async ({ query, set }: { query: Static<typeof querySchema>; set: any }) => {
		const { post_id } = query;

		if (!post_id || post_id.trim() === "") {
			set.status = 404;
			return {
				error: "You did not provide a valid Post ID.",
			};
		}

		const post = await database.Posts.get(post_id);
		return post;
	},
	{
		query: querySchema,
	}
);
