import { Elysia } from "elysia";
import * as database from "../../Serendipy/prisma.js";

export default new Elysia({ name: "partners/list" }).get(
	"/partners/list",
	async () => {
		const partners = await database.Partners.getAllPartners();
		return partners;
	}
);
