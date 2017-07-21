"use strict";

const Koa = require("koa");
const KoaRouter = require("koa-router");

const Loader = require("./loader");
const Runner = require("./runner");

let HOOKS = Loader.loadHooks();

const server = new Koa();
const router = new KoaRouter();

router.post("/:key/:task/:secret", (ctx) => {
	let { key, task, secret } = ctx.params;

	if (key in HOOKS === false) {
		ctx.status = 404;
		ctx.body = `Hook '${key}' not found.`;
		return;
	}

	let hook = HOOKS[key];
	let ip = ctx.request.ip;

	// Handle IPv4 addresses mapped ad IPv6.
	if (ip.startsWith("::ffff:") === true) {
		ip = ip.substring(7);
	}

	if (hook.sources.includes(ip) === false || hook.secret !== secret) {
		ctx.status = 401;
		return;
	}

	if (task in hook.tasks === false) {
		ctx.status = 404;
		ctx.body = `Task '${task}' not found in hook '${key}'.`;
		return;
	}

	Runner.runTask(hook, task);
	ctx.status = 200;
});

server.use(router.routes());
server.use(router.allowedMethods());

server.listen(46657);
