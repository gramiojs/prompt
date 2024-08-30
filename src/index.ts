/**
 * @module
 *
 * Prompt plugin for [GramIO](https://gramio.dev/).
 */
import { Plugin } from "gramio";
import { getPrompt, getWait, getWaitWithAction } from "./utils.js";

import type {
	EventsUnion,
	PromptFunctionParams,
	PromptPluginTypes,
	PromptsType,
} from "./types.ts";

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
	map?: PromptsType;
	defaults?: PromptFunctionParams<EventsUnion, GlobalData>;
}): Plugin<
	// biome-ignore lint/complexity/noBannedTypes: Temporal fix slow types compiler
	{},
	import("gramio").DeriveDefinitions & {
		[K in EventsUnion]: PromptPluginTypes<GlobalData>;
	}
> {
	const prompts: PromptsType = options?.map ?? new Map();

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
					// @ts-expect-error
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
					// @ts-ignore
					if (prompt.validate && !(await prompt.validate(context))) {
						if (typeof prompt.onValidateError === "string")
							return context.send(prompt.onValidateError);
						// @ts-ignore
						if (prompt.onValidateError) return prompt.onValidateError(context);
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
