/**
 * @module
 *
 * Prompt plugin for [GramIO](https://gramio.dev/).
 */
import { Plugin } from "gramio";
import { type PromptsType, getPrompt, getWait } from "./utils.js";

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
export function prompt(map?: PromptsType): Plugin<
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
			/**
			 * Wait for the next event from the user
			 *
			 * @example
			 * ```ts
			 * .command("start", async (context) => {
			 *         const answer = await context.wait();
			 *
			 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
			 * })
			 * ```
			 *  */
			readonly wait: import("./utils.ts").WaitFunction;
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
			/**
			 * Wait for the next event from the user
			 *
			 * @example
			 * ```ts
			 * .command("start", async (context) => {
			 *         const answer = await context.wait();
			 *
			 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
			 * })
			 * ```
			 *  */
			readonly wait: import("./utils.ts").WaitFunction;
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
			/**
			 * Wait for the next event from the user
			 *
			 * @example
			 * ```ts
			 * .command("start", async (context) => {
			 *         const answer = await context.wait();
			 *
			 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
			 * })
			 * ```
			 *  */
			readonly wait: import("./utils.ts").WaitFunction;
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
			/**
			 * Wait for the next event from the user
			 *
			 * @example
			 * ```ts
			 * .command("start", async (context) => {
			 *         const answer = await context.wait();
			 *
			 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
			 * })
			 * ```
			 *  */
			readonly wait: import("./utils.ts").WaitFunction;
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
			/**
			 * Wait for the next event from the user
			 *
			 * @example
			 * ```ts
			 * .command("start", async (context) => {
			 *         const answer = await context.wait();
			 *
			 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
			 * })
			 * ```
			 *  */
			readonly wait: import("./utils.ts").WaitFunction;
		};
	}
> {
	const prompts: PromptsType = map ?? new Map();

	return new Plugin("@gramio/prompt")
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
					 * Send message and wait answer
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
					// @ts-expect-error
					prompt: getPrompt(prompts, id, context),
					/**
					 * Wait for the next event from the user
					 *
					 * @example
					 * ```ts
					 * .command("start", async (context) => {
					 *         const answer = await context.wait();
					 *
					 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
					 * })
					 * ```
					 *  */
					wait: getWait(prompts, id),
				} as const;
			},
		)
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
						if (prompt.text)
							return context.send(prompt.text, prompt.sendParams);
						return;
					}

					prompt.resolve(
						// @ts-expect-error
						prompt.transform ? prompt.transform(context) : context,
					);
					return prompts.delete(id);
				}

				next();
			},
		);
}
