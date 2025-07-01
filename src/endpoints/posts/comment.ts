import { Elysia, Static, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";

const querySchema = t.Object({
	id: t.String(),
});

const bodySchema = t.Object({
	caption: t.String(),
	image: t.Optional(t.String()),
});

export default new Elysia({ name: "posts/comment" }).post(
	"/posts/comment",
	async ({
		request,
		query,
		body,
		set,
	}: {
		request: Request;
		query: Static<typeof querySchema>;
		body: Static<typeof bodySchema>;
		set: any;
	}) => {
		const authorization = request.headers.get("authorization");

		if (!authorization) {
			set.status = 401;
			return { error: "Missing authorization header." };
		}

		const user = await getAuth(authorization, "posts.comment");
		if (!user) {
			set.status = 401;
			return {
				error: "The provided user token is invalid, or the user does not exist.",
			};
		}

		const post = await database.Posts.get(query.id);
		if (!post) {
			set.status = 404;
			return { error: "The provided post id is invalid." };
		}

		const update = await database.Posts.comment(
			post.postid,
			user.userid,
			body.caption,
			body.image || null
		);

		if (update) {
			return { success: true };
		} else {
			set.status = 500;
			return {
				error: "Something went wrong with processing your request.",
			};
		}
	},
	{
		query: querySchema,
		body: bodySchema,
	}
);
