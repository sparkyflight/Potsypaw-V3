import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";

const querySchema = t.Object({
	tag: t.String(),
});

export default new Elysia({
	name: "Validate Username",
	detail: {
		summary: "Validate Username",
		description:
			"This endpoint checks if a username exists in the database. You must provide a valid username in the query parameter.",
		tags: ["Input Validation"],
	},
}).get(
	"/validate/username",
	async ({ query }) => {
		const user = await database.Users.get({ usertag: query.tag });

		return { exists: !!user };
	},
	{
		query: querySchema,
		response: {
			200: t.Object({
				exists: t.Boolean(),
			}),
			400: t.Object({
				error: t.Boolean(),
				message: t.String(),
			}),
		},
	}
);
