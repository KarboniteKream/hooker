"use strict";

const fs = require("fs");
const Log = require("unklogger");
const path = require("path");
const Schema = require("./schema");
const yaml = require("js-yaml");

function loadHooks() {
	let hooks = {};

	let directory = path.join(__dirname, "hooks");
	let files = fs.readdirSync(directory).filter((file) => {
		// TODO: Support both yaml and yml?
		return file.endsWith(".yaml");
	});

	for (let file of files) {
		let hook = null;

		try {
			hook = yaml.safeLoad(fs.readFileSync(path.join(directory, file), "utf-8"));
		} catch (err) {
			Log.error("Loader", `Unable to parse '${file}'.`);
			Log.error("Loader", err.message);
		}

		if (hook === null) {
			continue;
		}

		if (typeof hook === "undefined") {
			Log.warn("Loader", `File '${file}' is empty.`);
			continue;
		}

		Log.info("Loader", `Parsing '${file}'.`);
		hook = Schema.validateHook(hook);

		if (hook === null) {
			continue;
		}

		hook.key = file.slice(0, -5);
		let logs = path.join(__dirname, "logs", hook.key);

		if (fs.existsSync(logs) === false) {
			fs.mkdirSync(logs);
		}

		hooks[hook.key] = hook;
		Log.success("Loader", `Loaded '${file}'.`);
	}

	return hooks;
}

module.exports = {
	loadHooks,
};
