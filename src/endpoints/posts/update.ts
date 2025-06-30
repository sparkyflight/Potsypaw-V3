import { FastifyReply, FastifyRequest } from "fastify";
import * as database from "../../Serendipy/prisma.js";
import { getAuth } from "../../auth.js";
import { plugins } from "@prisma/client";

export default {
	url: "/posts/update",
	method: "PATCH",
	schema: {
		summary: "Update post",
		description: "Updates a post.",
		tags: ["posts"],
		body: {
			type: "object",
			properties: {
				caption: { type: "string" },
				image: { type: "string" },
				plugins: { type: "object" },
				post_id: { type: "string" },
			},
			required: ["caption", "post_id"],
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
			return reply.send({
				error: "Oops, it seems that you are not logged in.",
			});
		if (!data["post_id"])
			return reply.send({
				error: "Oops, it seems that you did not pass the Post ID.",
			});
		else {
			const user = await getAuth(Authorization, "posts.update");

			if (user) {
				let origPost = await database.Posts.get(data["post_id"]);

				if (origPost) {
					if (origPost.userid === user.userid) {
						if (!data["caption"] || data["caption"].error)
							return reply.send({
								success: false,
								error: "Sorry, a caption must be provided.",
							});

						await database.Posts.updatePost(data["post_id"], {
							caption: data["caption"],
							image: data["image"] || null,
							plugins: {
								create: data["plugins"].map(
									(plugin: plugins) => plugin
								),
							},
						});

						return reply.send({ success: true });
					} else
						return reply.send({
							success: false,
							error: "You are NOT the author of this post. Access denied.",
						});
				} else
					reply.send({
						success: false,
						error: "The Post ID provided is invalid.",
					});
			} else {
				return reply.send({
					success: false,
					error: "The user token was not passed with token.",
				});
			}
		}
	},
};
