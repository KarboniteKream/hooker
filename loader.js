"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function loadHooks() {
	let hooks = {};

	let directory = path.join(__dirname, "hooks");
	let files = fs.readdirSync(directory).filter((file) => {
		return file.endsWith(".yaml");
	});

	for (let file of files) {
		let hook = null;

		try {
			hook = yaml.safeLoad(fs.readFileSync(path.join(directory, file), "utf-8"));
		} catch (err) {
			console.error(`[Loader] Unable to parse '${file}'.\n${err.message}`);
		}

		if (hook === null || hook.enabled === false) {
			continue;
		}

		hook.key = file.slice(0, -5);
		let logs = path.join(__dirname, "logs", hook.key);

		if (fs.existsSync(logs) === false) {
			fs.mkdirSync(logs);
		}

		for (let task of Object.keys(hook.tasks)) {
			hook.tasks[task] = hook.tasks[task].trim();
		}

		hooks[hook.key] = hook;
	}

	return hooks;
}

module.exports = {
	loadHooks,
};
