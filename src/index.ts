/**
 * @module
 *
 * Prompt plugin for [GramIO](https://gramio.dev/).
 */
import { Plugin } from "gramio";
import { PromptCancelError } from "./prompt-cancel-error.ts";

import type {
	EventsUnion,
	PromptFunctionParams,
	PromptOptions,
	PromptPluginTypes,
	PromptsType,
	TimeoutStrategy,
} from "./types.ts";
import {
	emitCancelError,
	events,
	getPrompt,
	getWait,
	getWaitWithAction,
} from "./utils.ts";

export * from "./types.ts";

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
export function prompt<GlobalData = never>(
	options?: PromptOptions<GlobalData>,
): Plugin<
	{ "prompt-cancel": PromptCancelError },
	import("gramio").DeriveDefinitions & {
		[K in EventsUnion]: PromptPluginTypes<GlobalData>;
	}
> {
	const prompts: PromptsType = options?.map ?? new Map();
	const timeoutStrategy: TimeoutStrategy =
		options?.timeoutStrategy ?? "on-answer";

	return new Plugin("@gramio/prompt")
		.error("prompt-cancel", PromptCancelError)
		.derive(events, (context) => {
			const id = context.senderId || 0;

			return {
				prompt: getPrompt(
					prompts,
					id,
					// @ts-expect-error TODO: fix this
					context,
					options?.defaults || {},
					timeoutStrategy,
				),
				wait: getWait(prompts, id, timeoutStrategy),
				waitWithAction: getWaitWithAction(
					prompts,
					id,
					options?.defaults || {},
					timeoutStrategy,
				),
			} satisfies PromptPluginTypes<GlobalData>;
		})
		.on(events, async (context, next) => {
			const id = context.senderId || 0;
			const prompt = prompts.get(id);

			if (prompt) {
				if (prompt?.events && !context.is(prompt.events)) return next();

				if (prompt.timeoutExpiresAt && prompt.timeoutExpiresAt < Date.now()) {
					emitCancelError(prompts, id);
					return;
				}

				if (prompt.validate && !(await prompt.validate(context))) {
					if (typeof prompt.onValidateError === "string")
						return context.send(prompt.onValidateError);
					if (prompt.onValidateError)
						return prompt.onValidateError(context, prompt.actionReturn);
					if (prompt.text) return context.send(prompt.text, prompt.sendParams);
					return;
				}

				if (prompt.timeoutId) {
					clearTimeout(prompt.timeoutId);
				}

				prompt.resolve(
					// @ts-expect-error TODO: fix this
					prompt.transform ? prompt.transform(context) : context,
				);
				return prompts.delete(id);
			}

			return next();
		});
}
