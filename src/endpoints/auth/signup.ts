import { FastifyReply, FastifyRequest } from "fastify";
import * as database from "../../Serendipy/prisma.js";
import firebase from "firebase-admin";
import * as logger from "../../logger.js";

export default {
	method: ["GET", "POST", "PATCH", "HEAD", "OPTIONS", "DELETE"],
	url: "/auth/signup",
	schema: {
		querystring: {
			type: "object",
			properties: {
				tag: { type: "string" },
				uid: { type: "string" },
			},
			required: ["tag", "uid"],
		},
		security: [
			{
				apiKey: [],
			},
		],
	},
	handler: async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const Authorization: any = request.headers.authorization;
			const { tag }: any = request.query;

			const userInfo = await firebase
				.auth()
				.verifyIdToken(Authorization, true);
			const dbUser = await database.Users.get({
				userid: userInfo.uid,
			});

			if (dbUser) {
				return reply.send({
					error: true,
					message: "[Database Error] => User already exists.",
				});
			} else {
				const existingUser = await database.Users.get({
					usertag: tag,
				});
				if (existingUser) {
					return reply.send({
						error: true,
						message:
							"That usertag is already in use. Please choose a new one.",
					});
				} else {
					const result = await database.Users.createUser({
						name: tag,
						userid: userInfo.uid,
						usertag: tag,
						bio: "None",
						avatar: "/logo.png",
					});

					if (result === true)
						return reply.send({
							error: false,
							message: "User Created.",
						});
					else return reply.send({ error: true, message: result });
				}
			}
		} catch (error) {
			reply.status(500).send({
				error: "Internal Server Error",
				message: "An error occurred while processing your request.",
			});

			logger.error("Error during user signup", error);
		}
	},
};
