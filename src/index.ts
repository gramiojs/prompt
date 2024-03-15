import { Plugin } from "gramio";
import { type PromptsType, getPrompt } from "utils";

export function prompt() {
	const prompts: PromptsType = new Map();

	return (
		new Plugin("@gramio/prompt")
			// TODO: rewrite to plugin.on and refactor
			.group((bot) =>
				bot.on(
					[
						"message",
						"edited_message",
						"channel_post",
						"edited_channel_post",
						"callback_query",
					],
					(context, next) => {
						const id = context.senderId || 0;
						const prompt = prompts.get(id);

						if (prompt) {
							if (prompt?.event && !context.is(prompt.event)) return next();

							prompt.resolve(context);
							return prompts.delete(id);
						}

						next();
					},
				),
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
						prompt: getPrompt(prompts, id, context),
					};
				},
			)
	);
}
