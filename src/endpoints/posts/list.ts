import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";

export default new Elysia({
	name: "List Posts",
	detail: {
		summary: "List All Posts",
		description:
			"This endpoint retrieves a list of all posts from the database.",
		tags: ["Posts"],
		responses: generateResponses("posts", true),
	},
}).get("/posts", async () => {
	const posts = await database.Posts.listAllPosts();
	return posts;
});
