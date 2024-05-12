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

function isEvent(
	maybeEvent: EventsUnion | Stringable,
): maybeEvent is EventsUnion {
	return events.includes(maybeEvent.toString() as EventsUnion);
}

export interface PromptFunctionParams<Event extends EventsUnion>
	extends Optional<SendMessageParams, "chat_id" | "text"> {
	validate?: (context: PromptAnswer<Event>) => MaybePromise<boolean>;
}

type Stringable = string | { toString(): string };

export interface PromptFunction {
	(
		text: Stringable,
		params?: PromptFunctionParams<EventsUnion>,
	): Promise<PromptAnswer<EventsUnion>>;
	<Event extends EventsUnion>(
		event: Event,
		text: Stringable,
		params?: PromptFunctionParams<Event>,
	): Promise<PromptAnswer<Event>>;
}

export function getPrompt(
	prompts: PromptsType,
	id: number,
	context: PromptAnswer<EventsUnion>,
): PromptFunction {
	async function prompt<Event extends EventsUnion>(
		eventOrText: Event | Stringable,
		textOrParams?: Stringable | PromptFunctionParams<Event>,
		params?: PromptFunctionParams<Event>,
	) {
		const { validate, ...sendParams } =
			params ||
			(typeof textOrParams === "object" && !("toString" in textOrParams)
				? textOrParams
				: {});

		const text =
			isEvent(eventOrText) &&
			(typeof textOrParams === "string" ||
				(textOrParams &&
					typeof textOrParams !== "string" &&
					"toString" in textOrParams))
				? textOrParams
				: eventOrText;

		await context.send(text, sendParams);

		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event: isEvent(eventOrText) ? eventOrText : undefined,
				// @ts-expect-error
				validate,
				sendParams,
				text: text.toString(),
			});
		});
	}

	return prompt;
}
