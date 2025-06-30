import { FastifyReply, FastifyRequest } from "fastify";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { plugins } from "@prisma/client";

export default {
	url: "/posts/post",
	method: "POST",
	schema: {
		summary: "Create post",
		description: "Creates a post.",
		tags: ["posts"],
		body: {
			type: "object",
			properties: {
				caption: { type: "string" },
				type: { type: "number" },
				image: { type: "string" },
				plugins: { type: "array" },
			},
			required: ["caption", "type"],
		},
		security: [
			{
				apiKey: [],
			},
		],
	},
	handler: async (request: FastifyRequest, reply: FastifyReply) => {
		const data = request.body;
		const Authorization: any = request.headers.authorization;

		if (!Authorization)
			return reply.status(401).send({
				error: "Oops, it seems that you are not logged in.",
			});
		else {
			const user = await getAuth(Authorization, "posts.write");

			if (user) {
				await database.Posts.createPost({
					user: { connect: { userid: user.userid } },
					caption: data["caption"],
					type: data["type"],
					image: data["image"],
					plugins: {
						create: data["plugins"].map(
							(plugin: plugins) => plugin
						),
					},
					postid: crypto.randomUUID(),
				});

				return reply.send({ success: true });
			} else {
				return reply.send({
					success: false,
					error: "The user does not exist.",
				});
			}
		}
	},
};
