import { Elysia, t, Static } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";

const bodySchema = t.Object({
	name: t.String(),
	logo: t.String(),
});

export default new Elysia({
	name: "Add Application",
	detail: {
		summary: "Create a new application",
		description:
			"This endpoint allows you to create a new application by providing its name and logo.",
		tags: ["Applications"],
	},
}).post(
	"/applications",
	async ({
		request,
		body,
		set,
	}: {
		request: Request;
		body: Static<typeof bodySchema>;
		set: any;
	}) => {
		try {
			const authorization = request.headers.get("authorization");

			if (!authorization) {
				set.status = 401;
				return {
					error: true,
					message: "Missing authorization header.",
				};
			}

			const userInfo = await firebase
				.auth()
				.verifyIdToken(authorization, true);

			const dbUser = await database.Users.get({
				userid: userInfo.uid,
			});

			if (!dbUser) {
				return {
					token: authorization,
					error: true,
					message: "User does not exist.",
				};
			}

			const result = await database.Applications.createApp(
				dbUser.userid,
				body.name,
				body.logo
			);

			return {
				token: result,
			};
		} catch (error: any) {
			set.status = 500;

			return {
				error: "Internal Server Error",
				message: error?.errorInfo?.message || "Unexpected failure.",
			};
		}
	},
	{
		body: bodySchema,
		response: {
			200: t.Object({
				token: t.String(),
			}),
			401: t.Object({
				error: t.Boolean(),
				message: t.String(),
			}),
			500: t.Object({
				error: t.String(),
				message: t.String(),
			}),
		},
	}
);
