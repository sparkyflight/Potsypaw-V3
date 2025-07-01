import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";

const querySchema = t.Object({
	tag: t.String(),
});

export default new Elysia().get(
	"/users/list_posts",
	async ({ query, set }) => {
		const tag = query.tag;

		if (!tag) {
			set.status = 404;
			return {
				error: "There was no user tag specified with the request.",
			};
		}

		const user = await database.Users.get({ usertag: tag });

		if (!user) {
			set.status = 404;
			return {
				message:
					"We couldn't fetch any information about this user in our database",
				error: true,
			};
		}

		let posts = await database.Posts.getAllUserPosts(user.userid);
		posts.reverse();

		return posts;
	},
	{
		query: querySchema,
	}
);
