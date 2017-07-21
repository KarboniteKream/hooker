"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

function runTask(hook, task) {
	let filename = `${task}_${getTimestamp()}.log`;
	let log = fs.createWriteStream(path.join(__dirname, "logs", hook.key, filename));

	let shell = childProcess.spawn("/bin/sh", ["-c", hook.tasks[task]], {
		cwd: hook.directory,
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
	});
}

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
	runTask,
};
