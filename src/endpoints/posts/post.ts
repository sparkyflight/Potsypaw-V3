import { Elysia, t, Static } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import crypto from "crypto";

const bodySchema = t.Object({
	caption: t.String(),
	type: t.Number(),
	image: t.Optional(t.String()),
	plugins: t.Optional(t.Array(t.Any())),
});

export default new Elysia({
	name: "Create Post",
	detail: {
		summary: "Create Post",
		description:
			"This endpoint allows you to create a new post. You must provide a valid authorization token in the request header and the post details in the body.",
		tags: ["Posts"],
	},
}).post(
	"/posts/post",
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

		const user = await getAuth(authorization, "posts.write");

		if (!user) {
			set.status = 401;
			return { success: false, error: "The user does not exist." };
		}

		await database.Posts.createPost({
			user: { connect: { userid: user.userid } },
			caption: body.caption,
			type: body.type,
			image: body.image || null,
			plugins: {
				create: (body.plugins || []).map((plugin) => plugin),
			},
			postid: crypto.randomUUID(),
		});

		return { success: true };
	},
	{
		body: bodySchema,
	}
);
