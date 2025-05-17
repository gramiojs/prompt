/**
 * @module
 *
 * Prompt plugin for [GramIO](https://gramio.dev/).
 */
import { Plugin } from "gramio";
import { events, getPrompt, getWait, getWaitWithAction } from "./utils.js";

import type {
	EventsUnion,
	PromptFunctionParams,
	PromptPluginTypes,
	PromptsType,
} from "./types.ts";
import { PromptCancelError } from "./prompt-cancel-error.ts";

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
export function prompt<GlobalData = never>(options?: {
	map?: PromptsType<GlobalData>;
	defaults?: PromptFunctionParams<EventsUnion, GlobalData>;
}): Plugin<
	{ "prompt-cancel": PromptCancelError; },
	import("gramio").DeriveDefinitions & {
		[K in EventsUnion]: PromptPluginTypes<GlobalData>;
	}
> {
	const prompts: PromptsType = options?.map ?? new Map();

	return new Plugin("@gramio/prompt")
		.error("prompt-cancel", PromptCancelError)
		.derive(
			events,
			(context) => {
				const id = context.senderId || 0;

				return {
					prompt: getPrompt(prompts, id, context, options?.defaults || {}),
					wait: getWait(prompts, id),
					waitWithAction: getWaitWithAction(
						prompts,
						id,
						options?.defaults || {},
					),
				} satisfies PromptPluginTypes<GlobalData>;
			},
		)
		.on(
			events,
			async (context, next) => {
				const id = context.senderId || 0;
				const prompt = prompts.get(id);

				if (prompt) {
					if (prompt?.events && !context.is(prompt.events)) return next();

					if (prompt.timeoutExpiresAt && prompt.timeoutExpiresAt < Date.now()) {
						prompt.reject(new PromptCancelError("timeout"));
						return prompts.delete(id);
					}

					if (prompt.validate && !(await prompt.validate(context))) {
						if (typeof prompt.onValidateError === "string" )
							return context.send(prompt.onValidateError);
						if (prompt.onValidateError)
							return prompt.onValidateError(context, prompt.actionReturn);
						if (prompt.text)
							return context.send(prompt.text, prompt.sendParams);
						return;
					}

					prompt.resolve(
						prompt.transform ? prompt.transform(context) : context,
					);
					return prompts.delete(id);
				}

				return next();
			},
		);
}
