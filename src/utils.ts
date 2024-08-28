import {
	type AnyBot,
	type ContextType,
	FormattableString,
	type MaybePromise,
	type Optional,
	type SendMessageParams,
} from "gramio";

function isObject(item: any) {
	return item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge<Object extends Record<any, any>>(
	target: Object,
	source: Object,
): Object {
	const output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		for (const key of Object.keys(source)) {
			if (isObject(source[key])) {
				if (!(key in target)) Object.assign(output, { [key]: source[key] });
				// @ts-expect-error
				else output[key] = deepMerge(target[key], source[key]);
			} else {
				Object.assign(output, { [key]: source[key] });
			}
		}
	}
	return output;
}

type Stringable = string | FormattableString;

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

export type EventsUnion = (typeof events)[number];

type IsNever<T> = [T] extends [never] ? true : false;

type PromptAnswer<
	Event extends EventsUnion,
	Data = never,
> = IsNever<Data> extends true
	? ContextType<AnyBot, Event> & {
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
export type OnValidateErrorFunction<Event extends EventsUnion, Data> = (
	context: PromptAnswer<Event>,
) => any;

interface PromptData<Event extends EventsUnion, Data = never> {
	resolve: (context: PromptAnswer<Event, Data>) => void;
	event?: Event;
	validate?: ValidateFunction<Event, Data>;
	onValidateError?: string | OnValidateErrorFunction<Event, Data>;
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
	onValidateError?: OnValidateErrorFunction<Event, Data> | (string & {});
}

export interface PromptFunction<GlobalData = never> {
	/** Send message and wait answer */
	<Data = GlobalData>(
		text: Stringable,
		params?: PromptFunctionParams<EventsUnion, Data>,
	): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Send message and wait answer ignoring events not listed */
	<Event extends EventsUnion, Data = GlobalData>(
		event: Event,
		text: Stringable,
		params?: PromptFunctionParams<Event, Data>,
	): Promise<PromptAnswer<Event, Data>>;
}

export interface WaitFunction<GlobalData = never> {
	/** Wait for the next event from the user */
	<Data = GlobalData>(): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Wait for the next event from the user ignoring events not listed */
	<Event extends EventsUnion, Data = GlobalData>(
		event: Event,
	): Promise<PromptAnswer<Event, Data>>;
	/** Wait for the next event from the user ignoring non validated answers */
	<Data = GlobalData>(
		validate: ValidateFunction<EventsUnion, Data>,
	): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events with transformer */
	<Event extends EventsUnion, Data = GlobalData>(
		event: Event,
		options: {
			validate?: ValidateFunction<Event, Data>;
			transform?: TransformFunction<Event, Data>;
		},
	): Promise<PromptAnswer<Event, Data>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events */
	<Event extends EventsUnion, Data = GlobalData>(
		event: Event,
		validate: ValidateFunction<Event, Data>,
	): Promise<PromptAnswer<Event, Data>>;
}

export function getPrompt(
	prompts: PromptsType,
	id: number,
	context: PromptAnswer<EventsUnion>,
	defaults: PromptFunctionParams<any, any>,
): PromptFunction {
	async function prompt<Event extends EventsUnion, Data>(
		eventOrText: Event | Stringable,
		textOrParams?: Stringable | PromptFunctionParams<Event, Data>,
		params?: PromptFunctionParams<Event, Data>,
	) {
		const { validate, transform, onValidateError, ...sendParams } = deepMerge(
			defaults,
			params ||
				(typeof textOrParams === "object" &&
				!(textOrParams instanceof FormattableString)
					? textOrParams
					: {}),
		);

		const text =
			isEvent(eventOrText) &&
			(typeof textOrParams === "string" ||
				(textOrParams &&
					typeof textOrParams !== "string" &&
					textOrParams instanceof FormattableString))
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
				onValidateError,
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
					onValidateError?: string | OnValidateErrorFunction<Event, Data>;
			  },
	) {
		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event:
					// @ts-expect-error
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
				onValidateError:
					typeof validateOrOptions === "object"
						? validateOrOptions.onValidateError
						: undefined,
			});
		});
	}

	return wait;
}
