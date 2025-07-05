// Libraries
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Directories
const typesDir = path.resolve(__dirname, "../Serendipy/types");
const outputDir = path.resolve(__dirname, "../schemas");

// Create output directory if it doesn't exist
fs.mkdirSync(outputDir, { recursive: true });

// Function to fix $ref paths in the schema
const fixRefs = (obj: any) => {
	if (typeof obj !== "object" || obj === null) return;
	for (const key in obj) {
		if (key === "$ref" && typeof obj[key] === "string")
			obj[key] = obj[key].replace(
				"#/definitions/",
				"#/components/schemas/"
			);
		else fixRefs(obj[key]);
	}
};

// Read all TypeScript files in the types directory
const typeFiles = fs.readdirSync(typesDir).filter((f) => f.endsWith(".ts"));

for (const file of typeFiles) {
	const name = file.replace(/\.ts$/, "");
	const typeName = name.charAt(0).toUpperCase() + name.slice(1);

	const inputPath = `src/Serendipy/types/${file}`;
	const outPath = path.join(outputDir, `${typeName}.schema.json`);

	// Generate baseline schema using ts-json-schema-generator
	// This will create a JSON schema for the type
	console.log(`⏳ Generating schema for ${typeName}...`);
	execSync(
		`npx ts-json-schema-generator --path "${inputPath}" --type "*" --out "${outPath}"`
	);
	console.log(`✅ Saved: ${outPath}`);

	// Read the generated schema and fix the $ref paths
	const raw = fs.readFileSync(outPath, "utf-8");
	const schema = JSON.parse(raw);

	const fixedSchema = {
		...schema,
		components: {
			schemas: schema.definitions,
		},
	};
	delete fixedSchema.definitions;

	fixRefs(fixedSchema);
	fs.writeFileSync(
		outPath.split(".")[0] + ".swagger.schema.json",
		JSON.stringify(fixedSchema, null, 2)
	);
}
