import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";
import { getStackSession, StackAuthSessionData } from "../../lib.js";

export default new Elysia({
	name: "Get Application",
	detail: {
		summary: "Fetch all applications",
		description:
			"This endpoint retrieves all applications associated with the authenticated user.",
		tags: ["Applications"],
		responses: generateResponses("applications", true),
	},
}).get("/applications", async ({ request, set }) => {
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
			userid: stackAuth?.server_metadata.uid,
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
});
