import type {
	AnyBot,
	ContextType,
	FormattableString,
	MaybePromise,
	Optional,
	SendMessageParams,
} from "gramio";
import type { events } from "./utils.ts";

export type Stringable = string | FormattableString;

export type PromptsType<Data = never> = Map<
	number,
	PromptData<EventsUnion, Data>
>;

export type EventsUnion = (typeof events)[number];

type IsNever<T> = [T] extends [never] ? true : false;

export interface PromptPluginTypes<GlobalData = never> {
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
	prompt: PromptFunction<GlobalData>;
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
	wait: import("./types.ts").WaitFunction<GlobalData>;
	/**
	 * Wait for the next event from the user
	 *
	 * @example
	 * ```ts
	 * .command("start", async (context) => {
	 *         const [answer, message] = await context.waitWithAction("message", () => context.send("ok"));
	 *
	 *         return context.send(`✨ Next message after /start command is ${answer.text}`);
	 * })
	 * ```
	 *  */
	waitWithAction: import("./types.ts").WaitWithActionFunction<GlobalData>;
}

export type PromptAnswer<
	Event extends EventsUnion,
	Data = never,
> = IsNever<Data> extends true
	? ContextType<AnyBot, Event> & PromptPluginTypes
	: Data;

export type ValidateFunction<Event extends EventsUnion> = (
	context: PromptAnswer<Event, never>,
) => MaybePromise<boolean>;
export type TransformFunction<Event extends EventsUnion, Data> = (
	context: PromptAnswer<Event, never>,
) => MaybePromise<Data>;
export type OnValidateErrorFunction<
	Event extends EventsUnion,
	Data,
	ActionReturn = never,
> = (
	context: PromptAnswer<Event>,
	...data: IsNever<ActionReturn> extends true
		? []
		: [actionReturn: ActionReturn]
) => any;

interface PromptData<
	Event extends EventsUnion,
	Data = never,
	ActionReturn = any,
> {
	resolve: (context: PromptAnswer<Event, Data>) => void;
	events?: Event[];
	validate?: ValidateFunction<Event>;
	onValidateError?: string | OnValidateErrorFunction<Event, Data, ActionReturn>;
	actionReturn?: ActionReturn;
	transform?: TransformFunction<Event, Data>;
	sendParams?: Optional<SendMessageParams, "chat_id" | "text">;
	text?: string;
}

export interface PromptFunctionParams<Event extends EventsUnion, Data>
	extends Optional<SendMessageParams, "chat_id" | "text"> {
	validate?: ValidateFunction<Event>;
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
	<const Event extends EventsUnion, Data = GlobalData>(
		event: MaybeArray<Event>,
		text: Stringable,
		params?: PromptFunctionParams<Event, Data>,
	): Promise<PromptAnswer<Event, Data>>;
}

export interface WaitFunction<GlobalData = never> {
	/** Wait for the next event from the user */
	<Data = GlobalData>(): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Wait for the next event from the user ignoring events not listed */
	<const Event extends EventsUnion, Data = GlobalData>(
		event: MaybeArray<Event>,
	): Promise<PromptAnswer<Event, Data>>;
	/** Wait for the next event from the user ignoring non validated answers */
	<Data = GlobalData>(
		validate: ValidateFunction<EventsUnion>,
	): Promise<PromptAnswer<EventsUnion, Data>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events with transformer */
	<const Event extends EventsUnion, Data = GlobalData>(
		event: MaybeArray<Event>,
		options: {
			validate?: ValidateFunction<Event>;
			transform?: TransformFunction<Event, Data>;
		},
	): Promise<PromptAnswer<Event, Data>>;
	/** Wait for the next event from the user ignoring non validated answers and not listed events */
	<const Event extends EventsUnion, Data = GlobalData>(
		event: MaybeArray<Event>,
		validate: ValidateFunction<Event>,
	): Promise<PromptAnswer<Event, Data>>;
}

export interface WaitWithActionFunction<GlobalData = never> {
	// biome-ignore lint/style/useShorthandFunctionType: <explanation>
	<const Event extends EventsUnion, Data = GlobalData, ActionReturn = any>(
		event: MaybeArray<Event>,
		action: () => MaybePromise<ActionReturn>,
		validateOrOptions?:
			| ValidateFunction<Event>
			| {
					validate?: ValidateFunction<Event>;
					transform?: TransformFunction<Event, Data>;
					onValidateError?:
						| string
						| OnValidateErrorFunction<Event, Data, ActionReturn>;
			  },
	): Promise<[PromptAnswer<Event, Data>, ActionReturn]>;
}

export type MaybeArray<T> = T | T[];
