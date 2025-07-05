import { Elysia, t } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";

export default new Elysia({
	name: "Delete @me",
	detail: {
		summary: "Delete Account",
		description:
			"This endpoint allows you to delete your account. You must provide a valid authorization token in the request header.",
		tags: ["My Profile"],
	},
}).delete(
	"/users/@me",
	async ({ request, set }) => {
		const authorization = request.headers.get("authorization");

		if (!authorization) {
			set.status = 401;
			return {
				error: true,
				message: "Missing authorization header.",
			};
		}

		try {
			const userInfo = await firebase
				.auth()
				.verifyIdToken(authorization, true);

			const user = await database.Users.get({
				userid: userInfo.uid,
			});

			if (!user) {
				set.status = 404;
				return {
					error: true,
					message:
						"We couldn't fetch any information about you in our database",
					token: authorization,
				};
			}

			await database.Users.delete(userInfo.uid);
			await firebase.auth().deleteUser(userInfo.uid);

			return { success: true };
		} catch (error: any) {
			set.status = 500;
			return {
				error: true,
				message: error?.message || "An unexpected error occurred",
			};
		}
	},
	{
		response: {
			200: t.Object({
				success: t.Boolean(),
			}),
			401: t.Object({
				error: t.Boolean(),
				message: t.String(),
			}),
			404: t.Object({
				error: t.Boolean(),
				message: t.String(),
				token: t.String(),
			}),
		},
	}
);
