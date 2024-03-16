import type {
	BotLike,
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
	validate?: (context: PromptAnswer<Event>) => MaybePromise<boolean>;
	sendParams?: Optional<SendMessageParams, "chat_id" | "text">;
	text: string;
}

function isEvent(maybeEvent: EventsUnion | string): maybeEvent is EventsUnion {
	return events.includes(maybeEvent as EventsUnion);
}

export interface PromptFunctionParams<Event extends EventsUnion>
	extends Optional<SendMessageParams, "chat_id" | "text"> {
	validate?: (context: PromptAnswer<Event>) => MaybePromise<boolean>;
}

export interface PromptFunction {
	(
		text: string,
		params?: PromptFunctionParams<EventsUnion>,
	): Promise<PromptAnswer<EventsUnion>>;
	<Event extends EventsUnion>(
		event: Event,
		text: string,
		params?: PromptFunctionParams<Event>,
	): Promise<PromptAnswer<Event>>;
}

export function getPrompt(
	prompts: PromptsType,
	id: number,
	context: PromptAnswer<EventsUnion>,
): PromptFunction {
	async function prompt<Event extends EventsUnion>(
		eventOrText: Event | string,
		textOrParams?: string | PromptFunctionParams,
		params?: PromptFunctionParams,
	) {
		const { validate, ...sendParams } =
			params || (typeof textOrParams === "object" ? textOrParams : {});
		const text =
			isEvent(eventOrText) && typeof textOrParams === "string"
				? textOrParams
				: eventOrText;

		if ("send" in context) await context.send(text, sendParams);
		else await context.message?.send(text, sendParams);

		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event: isEvent(eventOrText) ? eventOrText : undefined,
				validate,
				sendParams,
				text,
			});
		});
	}

	return prompt;
}
