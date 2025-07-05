import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import prismaSchema from "../../schemas/PrismaTypes.swagger.schema.json" with { type: "json" };

export default new Elysia({
	name: "List Partners",
	detail: {
		summary: "List All Partners",
		description:
			"This endpoint retrieves a list of all partners from the database.",
		tags: ["Partners"],
	},
}).get(
	"/partners",
	async () => {
		const partners = await database.Partners.getAllPartners();
		return partners;
	},
	{
		response: {
			200: t.Array(prismaSchema.components.schemas.partners as any),
		} as any,
	}
);
