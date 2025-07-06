// utils/generateResponses.ts
import type { OpenAPIV3 } from "openapi-types";
import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import schemaJson from "../schemas/PrismaTypes.schema.json" with { type: "json" };

// Load Prisma-like JSON schemas
const rawSchemas = schemaJson.definitions ?? {};

/**
 * Generate OpenAPI responses, defaulting to 400/401/404/500, with custom 200 (zod or schema key)
 * @param input - Either a Zod schema or a string name from schema definitions
 * @param isArray - If the response is an array of items
 * @param description - Optional description override
 */
export const generateResponses = (
	input: ZodType | string,
	isArray = false,
	description = "Successful response"
): Record<string, OpenAPIV3.ResponseObject> => {
	let schema: OpenAPIV3.SchemaObject;

	if (typeof input === "string") {
		const base = rawSchemas[input];
		if (!base) throw new Error(`Schema "${input}" not found`);
		schema = isArray
			? { type: "array", items: base as OpenAPIV3.SchemaObject }
			: (base as OpenAPIV3.SchemaObject);
	} else {
		const zSchema = zodToJsonSchema(input);
		schema = isArray
			? {
					type: "array",
					items:
						zSchema.definitions?.[""] ||
						(zSchema as OpenAPIV3.SchemaObject),
				}
			: zSchema.definitions?.[""] || (zSchema as any);
	}

	return {
		200: {
			description,
			content: {
				"application/json": { schema },
			},
		},
		400: {
			description: "Bad Request",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "string", enum: ["BAD_REQUEST"] },
						},
						required: ["message", "code"],
					},
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "string", enum: ["UNAUTHORIZED"] },
						},
						required: ["message", "code"],
					},
				},
			},
		},
		404: {
			description: "Not Found",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "string", enum: ["NOT_FOUND"] },
						},
						required: ["message", "code"],
					},
				},
			},
		},
		500: {
			description: "Internal Server Error",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "string", enum: ["INTERNAL_ERROR"] },
						},
						required: ["message", "code"],
					},
				},
			},
		},
	};
};
