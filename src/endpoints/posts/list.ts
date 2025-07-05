import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

export default new Elysia({
	name: "List Posts",
	detail: {
		summary: "List All Posts",
		description:
			"This endpoint retrieves a list of all posts from the database.",
		tags: ["Posts"],
	},
}).get(
	"/posts",
	async () => {
		const posts = await database.Posts.listAllPosts();
		return posts;
	},
	{
		response: {
			200: t.Array(prismaSchema.components.schemas.posts as any),
		} as any,
	}
);
