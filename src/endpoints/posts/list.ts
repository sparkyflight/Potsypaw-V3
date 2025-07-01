import { Elysia } from "elysia";
import * as database from "../../Serendipy/prisma.js";

export default new Elysia({ name: "posts/list" }).get(
	"/posts/list",
	async () => {
		const posts = await database.Posts.listAllPosts();
		return posts;
	}
);
