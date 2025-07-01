import { Elysia, Static, t } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";

const bodySchema = t.Object({
	token: t.String(),
	name: t.String(),
	logo: t.String(),
	permissions: t.Array(t.Any()),
	active: t.Boolean(),
});

export default new Elysia({ name: "users/update-application" }).patch(
	"/users/applications",
	async ({
		request,
		body,
		set,
	}: {
		request: Request;
		body: Static<typeof bodySchema>;
		set: any;
	}) => {
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

			const dbUser = await database.Users.get({
				userid: userInfo.uid,
			});

			if (!dbUser) {
				set.status = 404;
				return {
					token: authorization,
					error: true,
					message: "User does not exist.",
				};
			}

			const updated = await database.Applications.updateApp(body.token, {
				name: body.name,
				logo: body.logo,
				permissions: body.permissions,
				active: body.active,
			});

			return updated;
		} catch (error: any) {
			set.status = 500;
			return {
				error: "Internal Server Error",
				message:
					error?.errorInfo?.message ??
					error?.message ??
					"Unexpected error.",
			};
		}
	},
	{
		body: bodySchema,
	}
);
