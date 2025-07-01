import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";

const querySchema = t.Object({
	tag: t.String(),
});

export default new Elysia().get(
	"/users/get",
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
	}
);
