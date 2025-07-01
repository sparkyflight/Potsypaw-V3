import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";

const querySchema = t.Object({
	tag: t.String(),
});

export default new Elysia().get(
	"/validate/username",
	async ({ query }) => {
		const user = await database.Users.get({ usertag: query.tag });

		return { exists: !!user };
	},
	{
		query: querySchema,
	}
);
