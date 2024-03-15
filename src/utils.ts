import type {
	BotLike,
	Context,
	ContextType,
	MaybePromise,
	Optional,
	SendMessageParams,
} from "gramio";

export type PromptsType = Map<number, PromptData<EventsUnion>>;

export const events = [
	"message",
	"edited_message",
	"channel_post",
	"edited_channel_post",
	"callback_query",
] as const;

type EventsUnion = (typeof events)[number];

type PromptAnswer<Event extends EventsUnion> = ContextType<BotLike, Event>;

interface PromptData<Event extends EventsUnion> {
	resolve: (context: PromptAnswer<Event>) => void;
	event?: Event;
}

function isEvent(maybeEvent: EventsUnion | string): maybeEvent is EventsUnion {
	return events.includes(maybeEvent as EventsUnion);
}

export interface PromptFunction {
	(
		text: string,
		params?: Optional<SendMessageParams, "chat_id" | "text">,
	): Promise<PromptAnswer<EventsUnion>>;
	<Event extends EventsUnion>(
		event: Event,
		text: string,
		params?: Optional<SendMessageParams, "chat_id" | "text">,
	): Promise<PromptAnswer<Event>>;
}

export function getPrompt(
	prompts: PromptsType,
	id: number,
	context: PromptAnswer<EventsUnion>,
): PromptFunction {
	async function prompt<Event extends EventsUnion>(
		eventOrText: Event | string,
		textOrParams?: string | Optional<SendMessageParams, "chat_id" | "text">,
		params?: Optional<SendMessageParams, "chat_id" | "text">,
	) {
		if (isEvent(eventOrText) && typeof textOrParams === "string") {
			if ("send" in context) await context.send(textOrParams, params);
			else await context.message?.send(textOrParams, params);
		} else if (typeof textOrParams !== "string") {
			if ("send" in context) await context.send(eventOrText, textOrParams);
			else await context.message?.send(eventOrText, textOrParams);
		}
		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event: isEvent(eventOrText) ? eventOrText : undefined,
			});
		});
	}

	return prompt;
}
