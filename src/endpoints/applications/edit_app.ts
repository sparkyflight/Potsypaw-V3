import { Elysia, Static, t } from "elysia";
import { z } from "zod";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { getStackSession, StackAuthSessionData } from "../../lib.js";

const bodySchema = t.Object({
	token: t.String(),
	name: t.String(),
	logo: t.String(),
	permissions: t.Array(t.Any()),
	active: t.Boolean(),
});

export default new Elysia({
	name: "Edit Application",
	detail: {
		summary: "Edit an existing application",
		description:
			"This endpoint allows you to edit an existing application in the database. You must provide the application token, name, logo, permissions, and active status.",
		tags: ["Applications"],
		responses: generateResponses(
			z.object({
				success: z.boolean(),
			}),
			false
		),
	},
}).patch(
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
		const authorization = request.headers.get("authorization");

		if (!authorization) {
			set.status = 401;
			return {
				error: true,
				message: "Missing authorization header.",
			};
		}

		try {
			let stackAuth: StackAuthSessionData;
			const stackSessionResult = await getStackSession(authorization);
			if (
				stackSessionResult &&
				typeof stackSessionResult === "object" &&
				"id" in stackSessionResult
			) {
				stackAuth = stackSessionResult as StackAuthSessionData;
			} else stackAuth = undefined as any;

			const dbUser = await database.Users.get({
				userid: stackAuth?.id,
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

			return {
				success: updated,
			};
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
