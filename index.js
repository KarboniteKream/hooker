"use strict";

const bodyParser = require("koa-bodyparser");
const Koa = require("koa");
const KoaRouter = require("koa-router");
const Loader = require("./loader");
const Log = require("unklogger");
const Runner = require("./runner");
const Schema = require("./schema");

let HOOKS = Loader.loadHooks();

const server = new Koa();
const router = new KoaRouter();
server.use(bodyParser());

server.use(async (ctx, next) => {
	const start = new Date();
	await next();
	const ms = new Date() - start;
	Log.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
	if (ctx.status !== 200) console.log(`RESPONSE: ${ctx.status} - ${ctx.body}`);
	else console.log(`RESPONSE: ${ctx.status}`);
});

router.post("/:key/:task?", async (ctx) => {
	if (ctx.params.key in HOOKS === false) {
		ctx.status = 404;
		ctx.body = `Hook '${ctx.params.key}' not found.`;
		return;
	}

	let hook = HOOKS[ctx.params.key];
	let parameters = Schema.parseParameters(ctx.request);

	if (parameters === null) {
		ctx.status = 500;
		ctx.body = "Unsupported Git service.";
		return;
	}

	if (hook.secret !== parameters.secret) {
		ctx.status = 401;
		return;
	}

	let tasks = hook.tasks.filter((task) => {
		if (typeof ctx.params.task === "undefined") {
			return true;
		}

		return task.name === ctx.params.task;
	});

	if (tasks.length === 0) {
		ctx.status = 404;
		ctx.body = `Task '${ctx.params.task}' not found in hook '${ctx.params.key}'.`;
	}

	for (let task of tasks) {
		if (task.enabled === false) {
			Log.warn(hook.name, `Task '${task.name}' is disabled.`);
			continue;
		}

		if (Runner.checkConditions(task, parameters) === false) {
			Log.info(hook.name, `Task '${task.name}' doesn't match conditions.`);
			continue;
		}

		let inits = [];

		if (task.init === true) {
			inits = hook.inits;
		} else if (task.init instanceof Array === true) {
			inits = hook.inits.filter((init) => {
				return task.init.includes(init.name);
			});
		}

		console.log(task);

		for (let init of inits) {
			if (init.enabled === false) {
				continue;
			}

			if (typeof init.directory === "undefined") {
				init.directory = task.directory;
			}

			if (Runner.checkConditions(init, parameters) === false) {
				Log.info(hook.name, `Init '${init.name}' doesn't match conditions.`);
				continue;
			}

			console.log(init);

			Log.success(hook.name, `Running init '${init.name}'.`);
			await Runner.run(hook, init);
		}

		console.log(task);

		Log.success(hook.name, `Running task '${task.name}'.`);
		let code = await Runner.run(hook, task);

		if (code !== 0) {
			Log.error(hook.name, `Task '${task.name}' exited with code ${code}.`);
			continue;
		}

		Log.success(hook.name, `Task '${task.name}' completed.`);
	}

	ctx.status = 200;
});

server.use(router.routes());
server.use(router.allowedMethods());

server.listen(46657);
