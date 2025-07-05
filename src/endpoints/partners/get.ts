import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

export default new Elysia({
	name: "Get Partner",
	detail: {
		summary: "Get Partner by ID",
		description:
			"This endpoint retrieves a partner's information based on the provided Partner ID.",
		tags: ["Partners"],
	},
}).get(
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
		response: {
			200: prismaSchema.components.schemas.partners,
		} as any,
	}
);
