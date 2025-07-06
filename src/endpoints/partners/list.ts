import { Elysia, t } from "elysia";
import * as database from "../../Serendipy/prisma.js";
import { generateResponses } from "../../scripts/load-schema.js";

export default new Elysia({
	name: "List Partners",
	detail: {
		summary: "List All Partners",
		description:
			"This endpoint retrieves a list of all partners from the database.",
		tags: ["Partners"],
		responses: generateResponses("partners", true),
	},
}).get("/partners", async () => {
	const partners = await database.Partners.getAllPartners();
	return partners;
});
