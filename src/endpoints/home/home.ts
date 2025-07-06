import { Elysia, t } from "elysia";
import { generateResponses } from "../../scripts/load-schema.js";
import { z } from "zod";

const formatTime = (seconds) => {
	const days = Math.floor(seconds / 86400);
	seconds -= days * 86400;

	const hours = Math.floor(seconds / (60 * 60));
	seconds -= hours * 3600;

	const minutes = Math.floor((seconds % (60 * 60)) / 60);
	seconds -= minutes * 60;

	const secs = Math.floor(seconds % 60);

	return `${days} days, ${hours} hours, ${minutes} minutes, ${secs} seconds`;
};

export default new Elysia({
	name: "Home",
	detail: {
		summary: "Root Endpoint",
		description:
			"This endpoint showcases the root of the API. It is used to verify that the API is running and to provide basic information about the API.",
		tags: ["Root"],
		responses: generateResponses(
			z.object({
				message: z.string(),
				description: z.string(),
				version: z.string(),
				docs: z.string(),
				uptime: z.string(),
			}),
			false
		),
	},
}).get("/", async () => {
	return {
		message: "Welcome to the Sparkyflight API!",
		description:
			"Sparkyflight isn't your typical social media network. It's a digital haven crafted specifically for the neurodiverse — especially autistic individuals — to express themselves, connect meaningfully, and explore their favorite subjects in a calm, structured, and supportive space.",
		version: "3.0.0",
		docs: "/swagger",
		uptime: formatTime(process.uptime()),
	};
});
