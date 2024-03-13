import {
	type BotLike,
	type ContextType,
	type Optional,
	Plugin,
	type SendMessageParams,
} from "gramio";

const events = [
	"message",
	"edited_message",
	"channel_post",
	"edited_channel_post",
	"callback_query",
] as const;

type EventsUnion = (typeof events)[number];

type PromptAnswer<Event extends EventsUnion> = ContextType<BotLike, Event>;

interface PromptData<Event extends EventsUnion> {
	resolve: (value: PromptAnswer<Event>) => void;
	event?: Event;
}

function isEvent(maybeEvent: EventsUnion | string): maybeEvent is EventsUnion {
	return events.includes(maybeEvent as EventsUnion);
}

export function prompt() {
	const prompts = new Map<number, PromptData<EventsUnion>>();

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

					function prompt<Event extends EventsUnion>(
						event: Event,
						text: string,
						params?: Optional<SendMessageParams, "chat_id" | "text">,
					): Promise<PromptAnswer<Event>>;
					function prompt(
						text: string,
						params?: Optional<SendMessageParams, "chat_id" | "text">,
					): Promise<PromptAnswer<EventsUnion>>;
					async function prompt<Event extends EventsUnion>(
						eventOrText: Event | string,
						textOrParams?:
							| string
							| Optional<SendMessageParams, "chat_id" | "text">,
						params?: Optional<SendMessageParams, "chat_id" | "text">,
					) {
						if (isEvent(eventOrText) && typeof textOrParams === "string") {
							if ("send" in context) await context.send(textOrParams, params);
							else await context.message?.send(textOrParams, params);
						} else if (typeof textOrParams !== "string") {
							if ("send" in context)
								await context.send(eventOrText, textOrParams);
							else await context.message?.send(eventOrText, textOrParams);
						}

						return new Promise<PromptAnswer<Event>>((resolve) => {
							prompts.set(id, {
								//@ts-expect-error
								resolve,
								event: isEvent(eventOrText) ? eventOrText : undefined,
							});
						});
					}

					return {
						prompt,
					};
				},
			)
	);
}
