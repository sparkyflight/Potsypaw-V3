import { Elysia, t, Static } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { plugins } from "@prisma/client";

const bodySchema = t.Object({
	caption: t.String(),
	image: t.Optional(t.String()),
	plugins: t.Optional(t.Array(t.Any())),
	post_id: t.String(),
});

export default new Elysia({ name: "posts/update" }).patch(
	"/posts/update",
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

		const user = await getAuth(authorization, "posts.update");

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
			set.status = 403;
			return {
				success: false,
				error: "You are NOT the author of this post. Access denied.",
			};
		}

		if (!body.caption) {
			return {
				success: false,
				error: "Sorry, a caption must be provided.",
			};
		}

		await database.Posts.updatePost(body.post_id, {
			caption: body.caption,
			image: body.image || null,
			plugins: {
				create: (body.plugins || []).map((plugin: plugins) => plugin),
			},
		});

		return { success: true };
	},
	{
		body: bodySchema,
	}
);
