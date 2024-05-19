/**
 * @module
 *
 * Prompt plugin for [GramIO](https://gramio.dev/).
 */
import { Plugin } from "gramio";
import { type PromptsType, getPrompt } from "./utils";

/**
 * Prompt plugin
 * @example
 * ```ts
 * import { Bot, format, bold } from "gramio";
 * import { prompt } from "@gramio/prompt";
 *
 * const bot = new Bot(process.env.token!)
 *     .extend(prompt())
 *     .command("start", async (context) => {
 *         const answer = await context.prompt(
 *             "message",
 *             format`What's your ${bold`name`}?`
 *         );
 *
 *         return context.send(`✨ Your name is ${answer.text}`);
 *     })
 *     .onStart(console.log);
 *
 * bot.start();
 * ```
 */
export function prompt(): Plugin<
	// biome-ignore lint/complexity/noBannedTypes: Temporal fix slow types compiler
	{},
	import("gramio").DeriveDefinitions & {
		message: {
			/**
			 * @example
			 * ```ts
			 * import { Bot, format, bold } from "gramio";
			 * import { prompt } from "@gramio/prompt";
			 *
			 * const bot = new Bot(process.env.token!)
			 *     .extend(prompt())
			 *     .command("start", async (context) => {
			 *         const answer = await context.prompt(
			 *             "message",
			 *             format`What's your ${bold`name`}?`
			 *         );
			 *
			 *         return context.send(`✨ Your name is ${answer.text}`);
			 *     })
			 *     .onStart(console.log);
			 *
			 * bot.start();
			 * ```
			 */
			readonly prompt: import("./utils.ts").PromptFunction;
		};
		edited_message: {
			/**
			 * @example
			 * ```ts
			 * import { Bot, format, bold } from "gramio";
			 * import { prompt } from "@gramio/prompt";
			 *
			 * const bot = new Bot(process.env.token!)
			 *     .extend(prompt())
			 *     .command("start", async (context) => {
			 *         const answer = await context.prompt(
			 *             "message",
			 *             format`What's your ${bold`name`}?`
			 *         );
			 *
			 *         return context.send(`✨ Your name is ${answer.text}`);
			 *     })
			 *     .onStart(console.log);
			 *
			 * bot.start();
			 * ```
			 */
			readonly prompt: import("./utils.ts").PromptFunction;
		};
		channel_post: {
			/**
			 * @example
			 * ```ts
			 * import { Bot, format, bold } from "gramio";
			 * import { prompt } from "@gramio/prompt";
			 *
			 * const bot = new Bot(process.env.token!)
			 *     .extend(prompt())
			 *     .command("start", async (context) => {
			 *         const answer = await context.prompt(
			 *             "message",
			 *             format`What's your ${bold`name`}?`
			 *         );
			 *
			 *         return context.send(`✨ Your name is ${answer.text}`);
			 *     })
			 *     .onStart(console.log);
			 *
			 * bot.start();
			 * ```
			 */
			readonly prompt: import("./utils.ts").PromptFunction;
		};
		edited_channel_post: {
			/**
			 * @example
			 * ```ts
			 * import { Bot, format, bold } from "gramio";
			 * import { prompt } from "@gramio/prompt";
			 *
			 * const bot = new Bot(process.env.token!)
			 *     .extend(prompt())
			 *     .command("start", async (context) => {
			 *         const answer = await context.prompt(
			 *             "message",
			 *             format`What's your ${bold`name`}?`
			 *         );
			 *
			 *         return context.send(`✨ Your name is ${answer.text}`);
			 *     })
			 *     .onStart(console.log);
			 *
			 * bot.start();
			 * ```
			 */
			readonly prompt: import("./utils.ts").PromptFunction;
		};
		callback_query: {
			/**
			 * @example
			 * ```ts
			 * import { Bot, format, bold } from "gramio";
			 * import { prompt } from "@gramio/prompt";
			 *
			 * const bot = new Bot(process.env.token!)
			 *     .extend(prompt())
			 *     .command("start", async (context) => {
			 *         const answer = await context.prompt(
			 *             "message",
			 *             format`What's your ${bold`name`}?`
			 *         );
			 *
			 *         return context.send(`✨ Your name is ${answer.text}`);
			 *     })
			 *     .onStart(console.log);
			 *
			 * bot.start();
			 * ```
			 */
			readonly prompt: import("./utils.ts").PromptFunction;
		};
	}
> {
	const prompts: PromptsType = new Map();

	return new Plugin("@gramio/prompt")
		.on(
			[
				"message",
				"edited_message",
				"channel_post",
				"edited_channel_post",
				"callback_query",
			],
			async (context, next) => {
				const id = context.senderId || 0;
				const prompt = prompts.get(id);

				if (prompt) {
					if (prompt?.event && !context.is(prompt.event)) return next();
					if (prompt.validate && !(await prompt.validate(context))) {
						return context.send(prompt.text, prompt.sendParams);
					}

					prompt.resolve(context);
					return prompts.delete(id);
				}

				next();
			},
		)
		.derive(
			[
				"message",
				"edited_message",
				"channel_post",
				"edited_channel_post",
				"callback_query",
			],
			(context) => {
				const id = context.senderId || 0;

				return {
					/**
					 * @example
					 * ```ts
					 * import { Bot, format, bold } from "gramio";
					 * import { prompt } from "@gramio/prompt";
					 *
					 * const bot = new Bot(process.env.token!)
					 *     .extend(prompt())
					 *     .command("start", async (context) => {
					 *         const answer = await context.prompt(
					 *             "message",
					 *             format`What's your ${bold`name`}?`
					 *         );
					 *
					 *         return context.send(`✨ Your name is ${answer.text}`);
					 *     })
					 *     .onStart(console.log);
					 *
					 * bot.start();
					 * ```
					 */
					prompt: getPrompt(prompts, id, context),
				} as const;
			},
		);
}
