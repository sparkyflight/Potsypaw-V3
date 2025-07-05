import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

const querySchema = t.Object({
	tag: t.String(),
});

export default new Elysia({
	name: "List a User's Posts",
	detail: {
		summary: "List User's Posts",
		description:
			"This endpoint retrieves a list of posts made by a user specified by their user tag. You must provide a valid user tag in the query parameter.",
		tags: ["Users"],
	},
}).get(
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
		response: {
			200: t.Array(prismaSchema.components.schemas.posts as any),
			404: t.Object({
				message: t.String(),
				error: t.Boolean(),
			}),
		},
	}
);
