import type {
	BotLike,
	ContextType,
	MaybePromise,
	Optional,
	SendMessageParams,
	Stringable,
} from "gramio";

export type PromptsType<Data = never> = Map<
	number,
	PromptData<EventsUnion, Data>
>;

export const events = [
	"message",
	"edited_message",
	"channel_post",
	"edited_channel_post",
	"callback_query",
] as const;

type EventsUnion = (typeof events)[number];

type IsNever<T> = [T] extends [never] ? true : false;

type PromptAnswer<
	Event extends EventsUnion,
	Data = never,
> = IsNever<Data> extends true
	? ContextType<BotLike, Event> & {
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
			wait: import("./utils.ts").WaitFunction;
		}
	: Data;

export type ValidateFunction<Event extends EventsUnion, Data> = (
	context: PromptAnswer<Event, Data>,
) => MaybePromise<boolean>;

export type TransformFunction<Event extends EventsUnion, Data> = (
	context: PromptAnswer<Event, never>,
) => MaybePromise<Data>;

interface PromptData<Event extends EventsUnion, Data = never> {
	resolve: (context: PromptAnswer<Event, Data>) => void;
	event?: Event;
	validate?: ValidateFunction<Event, Data>;
	transform?: TransformFunction<Event, Data>;
	sendParams?: Optional<SendMessageParams, "chat_id" | "text">;
	text?: string;
}

function isEvent(
	maybeEvent: EventsUnion | Stringable,
): maybeEvent is EventsUnion {
	return events.includes(maybeEvent.toString() as EventsUnion);
}

export interface PromptFunctionParams<Event extends EventsUnion, Data>
	extends Optional<SendMessageParams, "chat_id" | "text"> {
	validate?: ValidateFunction<Event, Data>;
	transform?: TransformFunction<Event, Data>;
}

export interface PromptFunction {
	/** Send message and wait answer */
	<Data = never>(
		text: Stringable,
		params?: PromptFunctionParams<EventsUnion, Data>,
	): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Send message and wait answer ignoring events not listed */
	<Event extends EventsUnion, Data = never>(
		event: Event,
		text: Stringable,
		params?: PromptFunctionParams<Event, Data>,
	): Promise<PromptAnswer<Event, Data>>;
}

export interface WaitFunction {
	/** Wait for the next event from the user */
	<Data = never>(): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Wait for the next event from the user ignoring events not listed */
	<Event extends EventsUnion, Data = never>(
		event: Event,
	): Promise<PromptAnswer<Event, Data>>;
	/** Wait for the next event from the user ignoring non validated answers */
	<Data = never>(
		validate: ValidateFunction<EventsUnion, Data>,
	): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events with transformer */
	<Event extends EventsUnion, Data = never>(
		event: Event,
		options: {
			validate?: ValidateFunction<Event, Data>;
			transform?: TransformFunction<Event, Data>;
		},
	): Promise<PromptAnswer<Event, Data>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events */
	<Event extends EventsUnion, Data = never>(
		event: Event,
		validate: ValidateFunction<Event, Data>,
	): Promise<PromptAnswer<Event, Data>>;
}

export function getPrompt(
	prompts: PromptsType,
	id: number,
	context: PromptAnswer<EventsUnion>,
): PromptFunction {
	async function prompt<Event extends EventsUnion, Data>(
		eventOrText: Event | Stringable,
		textOrParams?: Stringable | PromptFunctionParams<Event, Data>,
		params?: PromptFunctionParams<Event, Data>,
	) {
		const { validate, transform, ...sendParams } =
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

		return new Promise<PromptAnswer<Event, Data>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event: isEvent(eventOrText) ? eventOrText : undefined,
				validate,
				// @ts-expect-error
				transform,
				sendParams,
				text: text.toString(),
			});
		});
	}

	return prompt;
}

export function getWait(prompts: PromptsType, id: number): WaitFunction {
	async function wait<Event extends EventsUnion, Data>(
		eventOrValidate?: Event | ValidateFunction<Event, Data>,
		validateOrOptions?:
			| ValidateFunction<Event, Data>
			| {
					validate?: ValidateFunction<Event, Data>;
					transform?: TransformFunction<Event, Data>;
			  },
	) {
		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event:
					eventOrValidate && isEvent(eventOrValidate)
						? eventOrValidate
						: undefined,
				validate:
					typeof eventOrValidate === "function"
						? eventOrValidate
						: typeof validateOrOptions === "object"
							? validateOrOptions.validate
							: undefined,
				// @ts-expect-error
				transform:
					typeof validateOrOptions === "object"
						? validateOrOptions.transform
						: undefined,
			});
		});
	}

	return wait;
}
