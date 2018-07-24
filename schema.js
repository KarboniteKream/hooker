"use strict";

const Joi = require("joi");
const Log = require("unklogger");
const os = require("os");

let STRING = Joi.string().trim();
let DIRECTORY = STRING.replace(/^~/, os.homedir());
let CONDITIONS = /repository|branch|message|author|committer/;

let REGEX = [
	STRING.regex(/^[^/]/),
	STRING.regex(/^\/(.*)\/[gimu]*$/),
];

let HOOK = Joi.object().keys({
	name: STRING.required(),
	enabled: Joi.boolean().default(true),
	secret: STRING.required(),
	directory: DIRECTORY,
	inits: Joi.array().items(Joi.object().keys({
		name: STRING.required(),
		enabled: Joi.boolean().default(true),
		directory: DIRECTORY,
		conditions: Joi.object().pattern(CONDITIONS, REGEX),
		script: STRING.required(),
	})),
	tasks: Joi.array().items(Joi.object().keys({
		name: STRING.required(),
		enabled: Joi.boolean().default(true),
		directory: DIRECTORY.default(Joi.ref("$directory")),
		init: Joi.alternatives().try([
			Joi.array().items(STRING.valid(Joi.ref("$inits"))).single(),
			Joi.boolean(),
		]).default(true),
		conditions: Joi.object().pattern(CONDITIONS, REGEX),
		script: STRING.required(),
	})).required(),
});

function validateHook(hook) {
	let inits = [];

	if (typeof hook.directory === "string") {
		hook.directory = hook.directory.replace(/^~/, os.homedir());
	}

	if (hook.inits instanceof Array === true) {
		inits = hook.inits.filter((init) => {
			return (typeof init.name === "string");
		}).map((init) => {
			return init.name.trim();
		});
	}

	let result = Joi.validate(hook, HOOK, {
		// TODO: Allow unknown properties.
		abortEarly: false,
		context: {
			directory: hook.directory,
			inits: inits,
		},
	});

	if (result.error !== null) {
		for (let error of result.error.details) {
			Log.error(hook.name || "Hook", `${error.path}: ${error.message}.`);
		}

		return null;
	}

	for (let task of result.value.tasks) {
		if (task.init instanceof Array === false) {
			continue;
		}

		let unique = [...new Set(task.init)];

		if (task.init.length !== unique.length) {
			Log.warn(result.value.name, `Task '${task.name}' has duplicate inits.`);
		}

		task.init = [...new Set(task.init)];
	}

	return result.value;
}

function parseParameters(request) {
	let parameters = null;

	// Gogs/Gitea.
	// TODO: Check 'user-agent' instead?
	if (typeof request.header["x-gogs-event"] !== "undefined") {
		let data = request.body;
		let commit = data.commits[0];

		parameters = {
			secret: data.secret,
			repository: data.repository.full_name,
			branch: data.ref.substr(11),
			message: commit.message.trim(),
			author: `${commit.author.name} <${commit.author.email}>`,
			committer: `${commit.committer.name} <${commit.committer.email}>`,
		};
	} else if (typeof request.header["x-gitlab-event"] !== "undefined") {
		let data = request.body;
		let commit = data.commits[0]; // OK

		console.log("HOOK", data);

		parameters = {
			secret: data.secret, // TODO:
			repository: data.project.path_with_namespace, // OK

			branch: data.ref.substr(11), // OK
			message: commit.message.trim(), // OK
			author: `${commit.author.name} <${commit.author.email}>`, // OK
			committer: `${commit.author.name} <${commit.author.email}>`, // OK
		};
	}

	return parameters;
}

module.exports = {
	validateHook,
	parseParameters,
};
