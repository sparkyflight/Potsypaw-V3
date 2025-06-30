import chalk from "chalk";

// Toggle debug logging globally
const DEBUG_ENABLED = true;

// Timestamp generator
const timestamp = () => chalk.gray(`[${new Date().toISOString()}]`);

// Pad log levels for clean formatting
const label = (type: string, color: (text: string) => string) =>
	chalk.bold(color(type.padEnd(7)));

// Fastify logger interface
const allowedKeys = ["method", "url", "statusCode", "error", "message", "msg"];
const filterData = (data: Record<string, any> | undefined) => {
	if (!data || typeof data !== "object") return data;

	return Object.fromEntries(
		Object.entries(data)
			.filter(([key]) => allowedKeys.includes(key))
			.map(([key, value]) => {
				// If value is an object/array, stringify or simplify it
				if (typeof value === "object" && value !== null) {
					// You can stringify deeply nested objects or just say "[Object]"
					return [key, JSON.stringify(value)];
				}
				return [key, value];
			})
	);
};
const formatArgs = (msg: any, args: any[]) => {
	if (typeof msg === "string")
		return { message: msg, data: filterData(args[0]) };
	return { message: args[0] ?? "", data: filterData(msg) };
};

const logger = {
	info: (msg: any, ...args: any[]) => {
		const { message, data } = formatArgs(msg, args);
		log("INFO", "Fastify", message, data);
	},
	debug: (msg: any, ...args: any[]) => {
		if (!DEBUG_ENABLED) return;
		const { message, data } = formatArgs(msg, args);
		log("DEBUG", "Fastify", message, data);
	},
	error: (msg: any, ...args: any[]) => {
		const { message, data } = formatArgs(msg, args);
		log("ERROR", "Fastify", message, data);
	},
	warn: (msg: any, ...args: any[]) => {
		const { message, data } = formatArgs(msg, args);
		log("INFO", "Fastify", `⚠️ ${message}`, data);
	},
	trace: () => {},
	fatal: (msg: any, ...args: any[]) => {
		const { message, data } = formatArgs(msg, args);
		log("ERROR", "Fastify", `FATAL: ${message}`, data);
	},
	child: () => logger,
	level: "info",
	silent: false,
};

// Core logger function
const log = (
	type: "INFO" | "DEBUG" | "ERROR" | "SUCCESS",
	name: string,
	message: string,
	data?: Record<string, any>
) => {
	let colorFunc;
	switch (type) {
		case "INFO":
			colorFunc = chalk.blue;
			break;
		case "DEBUG":
			colorFunc = chalk.cyan;
			break;
		case "ERROR":
			colorFunc = chalk.red;
			break;
		case "SUCCESS":
			colorFunc = chalk.green;
			break;
	}

	const formatted = `${timestamp()} ${label(
		type,
		colorFunc
	)} [${chalk.magenta(name)}] ${chalk.white("=>")} ${message}`;
	console.log(formatted);

	if (data) {
		console.dir(data, { depth: null, colors: true });
	}
};

// Public log methods
const info = (name: string, message: string, data?: Record<string, any>) =>
	log("INFO", name, message, data);

const debug = (name: string, message: string, data?: Record<string, any>) => {
	if (DEBUG_ENABLED) log("DEBUG", name, message, data);
};

const error = (name: string, message: string, data?: Record<string, any>) =>
	log("ERROR", name, message, data);

const success = (name: string, message: string, data?: Record<string, any>) =>
	log("SUCCESS", name, message, data);

// Export
export { info, debug, error, success, logger };
