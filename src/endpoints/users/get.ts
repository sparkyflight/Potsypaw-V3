import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

const querySchema = t.Object({
	tag: t.String(),
});

export default new Elysia({
	name: "Get User",
	detail: {
		summary: "Get User by Tag",
		description:
			"This endpoint retrieves a user's information based on their usertag. You must provide a valid usertag in the query parameter.",
		tags: ["Users"],
	},
}).get(
	"/users",
	async ({ query, set }) => {
		const user = await database.Users.get({ usertag: query.tag });

		if (user) {
			return user;
		} else {
			set.status = 404;
			return {
				message:
					"We couldn't fetch any information about this user in our database",
				error: true,
			};
		}
	},
	{
		query: querySchema,
		response: {
			200: prismaSchema.components.schemas.users as any,
			404: t.Object({
				message: t.String(),
				error: t.Boolean(),
			}),
		},
	}
);
