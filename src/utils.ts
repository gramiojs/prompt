import type {
	BotLike,
	ContextType,
	MaybePromise,
	Optional,
	SendMessageParams,
	Stringable,
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

type PromptAnswer<Event extends EventsUnion> = ContextType<BotLike, Event> & {
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
	prompt: PromptFunction;
};

interface PromptData<Event extends EventsUnion> {
	resolve: (context: PromptAnswer<Event>) => void;
	event?: Event;
	validate?: (context: PromptAnswer<Event>) => MaybePromise<boolean>;
	sendParams?: Optional<SendMessageParams, "chat_id" | "text">;
	text?: string;
}

function isEvent(
	maybeEvent: EventsUnion | Stringable,
): maybeEvent is EventsUnion {
	return events.includes(maybeEvent.toString() as EventsUnion);
}

export type ValidateFunction<Event extends EventsUnion> = (
	context: PromptAnswer<Event>,
) => MaybePromise<boolean>;

export interface PromptFunctionParams<Event extends EventsUnion>
	extends Optional<SendMessageParams, "chat_id" | "text"> {
	validate?: ValidateFunction<Event>;
}

export interface PromptFunction {
	/** Send message and wait answer */
	(
		text: Stringable,
		params?: PromptFunctionParams<EventsUnion>,
	): Promise<PromptAnswer<EventsUnion>>;
	/** Send message and wait answer ignoring events not listed */
	<Event extends EventsUnion>(
		event: Event,
		text: Stringable,
		params?: PromptFunctionParams<Event>,
	): Promise<PromptAnswer<Event>>;
}

export interface WaitFunction {
	/** Wait for the next event from the user */
	(): Promise<PromptAnswer<EventsUnion>>;
	/** Wait for the next event from the user ignoring events not listed */
	<Event extends EventsUnion>(event: Event): Promise<PromptAnswer<Event>>;
	/** Wait for the next event from the user ignoring non validated answers */
	(validate: ValidateFunction<EventsUnion>): Promise<PromptAnswer<EventsUnion>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events */
	<Event extends EventsUnion>(
		event: Event,
		validate: ValidateFunction<Event>,
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

export function getWait(prompts: PromptsType, id: number): WaitFunction {
	async function wait<Event extends EventsUnion>(
		eventOrValidate?: Event | ValidateFunction<Event>,
		validate?: ValidateFunction<Event>,
	) {
		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event:
					eventOrValidate && isEvent(eventOrValidate)
						? eventOrValidate
						: undefined,
				// @ts-expect-error
				validate:
					typeof eventOrValidate === "function" ? eventOrValidate : validate,
			});
		});
	}

	return wait;
}
