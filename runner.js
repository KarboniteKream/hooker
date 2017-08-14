"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const Log = require("unklogger");
const path = require("path");

function checkConditions(task, parameters) {
	if (typeof task.conditions === "undefined") {
		return true;
	}

	let match = true;

	for (let name in task.conditions) {
		let condition = task.conditions[name];

		if (condition[0] === "/") {
			let regex = null;

			try {
				let match = condition.match(/^\/(.*)\/([gimu]*)$/);
				regex = new RegExp(match[1], match[2]);
			} catch (err) {
				Log.warn(task.name, `Regex in condition '${name}' is not valid.`);
				match = false;
				break;
			}

			if (regex.test(parameters[name]) === false) {
				match = false;
				break;
			}
		} else if (condition !== parameters[name]) {
			match = false;
			break;
		}
	}

	return match;
}

function run(hook, task) {
	return new Promise((resolve) => {
		let filename = `${task.name}_${getTimestamp()}.log`;
		let log = fs.createWriteStream(path.join(__dirname, "logs", hook.key, filename));

		let shell = childProcess.spawn("/bin/sh", ["-c", task.script], {
			cwd: task.directory,
		});

		shell.stdout.on("data", (data) => {
			log.write(data);
		});

		shell.stderr.on("data", (data) => {
			log.write(data);
		});

		shell.on("exit", (code) => {
			log.write(`[Runner] Exited with code ${code}.\n`);
			log.end();
			resolve(code);
		});
	});
}

// TODO: Export in 'unklogger', rename to 'timestamp'.
function getTimestamp() {
	let date = new Date();

	let year = date.getFullYear();
	let month = pad(date.getMonth() + 1);
	let day = pad(date.getDate());
	let hour = pad(date.getHours());
	let minute = pad(date.getMinutes());
	let second = pad(date.getSeconds());

	return `${year}-${month}-${day}_${hour}:${minute}:${second}`;
}

function pad(number) {
	// eslint-disable-next-line no-extra-parens
	return (number < 10) ? ("0" + number) : number;
}

module.exports = {
	checkConditions,
	run,
};
