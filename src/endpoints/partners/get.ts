import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";

export default new Elysia({ name: "partners/get" }).get(
	"/partners/get",
	async ({ query, set }) => {
		const { id } = query;

		if (!id || id.trim() === "") {
			set.status = 404;
			return {
				error: "You did not provide a valid Partner ID.",
			};
		}

		const partner = await database.Partners.get({ id });

		return partner;
	},
	{
		query: t.Object({
			id: t.String(),
		}),
	}
);
