import { Elysia, t } from "elysia";
import firebase from "firebase-admin";
import * as database from "../../Serendipy/prisma.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

export default new Elysia({
	name: "Get Application",
	detail: {
		summary: "Fetch all applications",
		description:
			"This endpoint retrieves all applications associated with the authenticated user.",
		tags: ["Applications"],
	},
}).get(
	"/applications",
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

			const apps = await database.Applications.getAllApplications(
				dbUser.userid
			);

			if (!Array.isArray(apps) || apps.length === 0) {
				set.status = 404;
				return {
					message:
						"We couldn't fetch any Developer Applications under your profile. Please create one, and try again!",
					token: authorization,
					error: true,
				};
			}

			return apps;
		} catch (error: any) {
			set.status = 500;
			return {
				error: "Internal Server Error",
				message:
					error?.errorInfo?.message ||
					error?.message ||
					"Unexpected error.",
			};
		}
	},
	{
		response: {
			200: t.Array(prismaSchema.components.schemas.applications as any),
			404: t.Object({
				message: t.String(),
				token: t.String(),
				error: t.Boolean(),
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
