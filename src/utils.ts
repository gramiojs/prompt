import { type BotLike, type ContextType, FormattableString } from "gramio";
// import { setTimeout } from "node:timers";
import { PromptCancelError } from "./prompt-cancel-error.ts";
import type {
	EventsUnion,
	MaybeArray,
	OnValidateErrorFunction,
	PromptAnswer,
	PromptFunction,
	PromptFunctionParams,
	PromptsType,
	Stringable,
	TimeoutStrategy,
	TransformFunction,
	ValidateFunction,
	WaitFunction,
	WaitWithActionFunction,
} from "./types.ts";

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

export const events = [
	"message",
	"edited_message",
	"channel_post",
	"edited_channel_post",
	"callback_query",
] as const;

function isEvent(
	maybeEvent: MaybeArray<EventsUnion> | Stringable,
): maybeEvent is EventsUnion | EventsUnion[] {
	if (Array.isArray(maybeEvent))
		return maybeEvent.every((event) => events.includes(event));

	return events.includes(maybeEvent.toString() as EventsUnion);
}

export function getPrompt(
	prompts: PromptsType,
	id: number,
	context: PromptAnswer<EventsUnion>,
	defaults: PromptFunctionParams<any, any>,
	timeoutStrategy: TimeoutStrategy,
): PromptFunction {
	async function prompt<
		Event extends EventsUnion,
		Data,
		ActionReturn = ContextType<BotLike, "message">,
	>(
		eventOrText: MaybeArray<Event> | Stringable,
		textOrParams?: Stringable | PromptFunctionParams<Event, Data>,
		params?: PromptFunctionParams<Event, Data, ActionReturn>,
	) {
		const { validate, transform, onValidateError, timeout, ...sendParams } =
			deepMerge(
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

		const message = await context.send(text, sendParams);

		const events = isEvent(eventOrText) ? eventOrText : undefined;

		return new Promise<PromptAnswer<Event, Data>>((resolve, reject) => {
			prompts.set(id, {
				actionReturn: message,
				// @ts-expect-error TODO: fix this
				resolve: resolve,
				reject: reject,
				timeoutExpiresAt: timeout ? Date.now() + timeout : undefined,
				timeoutId:
					timeoutStrategy === "on-timer" && timeout
						? setTimeoutCancel(prompts, id, timeout)
						: undefined,
				events: Array.isArray(events) ? events : events ? [events] : undefined,
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

function setTimeoutCancel(prompts: PromptsType, id: number, timeout: number) {
	return setTimeout(() => emitCancelError(prompts, id), timeout)[
		Symbol.toPrimitive
	]();
}

export function getWait(
	prompts: PromptsType,
	id: number,
	timeoutStrategy: TimeoutStrategy,
): WaitFunction {
	async function wait<Event extends EventsUnion, Data>(
		eventOrValidate?: MaybeArray<Event> | ValidateFunction<Event>,
		validateOrOptions?:
			| ValidateFunction<Event>
			| {
					validate?: ValidateFunction<Event>;
					transform?: TransformFunction<Event, Data>;
					onValidateError?:
						| string
						| OnValidateErrorFunction<Event, Data, never>;
					timeout?: number;
			  },
	) {
		const events =
			eventOrValidate &&
			typeof eventOrValidate !== "function" &&
			isEvent(eventOrValidate)
				? eventOrValidate
				: undefined;

		const timeout =
			typeof validateOrOptions === "object" && "timeout" in validateOrOptions
				? validateOrOptions.timeout
				: undefined;

		return new Promise<PromptAnswer<Event>>((resolve, reject) => {
			prompts.set(id, {
				// @ts-expect-error TODO: fix this
				resolve: resolve,
				reject: reject,
				events: Array.isArray(events) ? events : events ? [events] : undefined,
				timeoutExpiresAt: timeout ? Date.now() + timeout : undefined,
				timeoutId:
					timeoutStrategy === "on-timer" && timeout
						? setTimeoutCancel(prompts, id, timeout)
						: undefined,
				// @ts-expect-error TODO: fix this
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
				// @ts-expect-error TODO: fix this
				onValidateError:
					typeof validateOrOptions === "object" ||
					typeof validateOrOptions === "string"
						? validateOrOptions.onValidateError
						: undefined,
			});
		});
	}

	return wait;
}

export function getWaitWithAction(
	prompts: PromptsType,
	id: number,
	defaults: PromptFunctionParams<any, any>,
	timeoutStrategy: TimeoutStrategy,
): WaitWithActionFunction {
	async function prompt<
		Event extends EventsUnion,
		Data = never,
		ActionReturn = any,
	>(
		events: MaybeArray<EventsUnion>,
		action: () => ActionReturn,
		validateOrOptions?:
			| ValidateFunction<Event>
			| {
					validate?: ValidateFunction<Event>;
					transform?: TransformFunction<Event, Data>;
					onValidateError?: string | OnValidateErrorFunction<Event, Data>;
					timeout?: number;
			  },
	) {
		const actionReturn = await action();

		const options = deepMerge(
			defaults,
			typeof validateOrOptions === "function"
				? {
						validate: validateOrOptions,
					}
				: (validateOrOptions ?? {}),
		);

		// const transform =
		// 	typeof validateOrOptions === "object"
		// 		? validateOrOptions.transform
		// 		: undefined;
		// const validate =
		// 	typeof validateOrOptions === "object"
		// 		? validateOrOptions.validate
		// 		: undefined;
		// const onValidateError =
		// 	typeof validateOrOptions === "object"
		// 		? validateOrOptions.onValidateError
		// 		: undefined;

		const timeout =
			typeof validateOrOptions === "object" && "timeout" in validateOrOptions
				? validateOrOptions.timeout
				: undefined;

		return new Promise<[PromptAnswer<Event, Data>, ActionReturn]>(
			(resolve, reject) => {
				prompts.set(id, {
					actionReturn,
					// @ts-expect-error TODO: fix this
					resolve: resolve,
					reject: reject,
					events: Array.isArray(events) ? events : [events],
					validate: options.validate,
					// @ts-expect-error
					transform: async (context) => {
						const transformedContext = options.transform
							? await options.transform(context)
							: context;

						return [transformedContext, actionReturn];
					},
					onValidateError: options.onValidateError,
					timeoutExpiresAt: timeout ? Date.now() + timeout : undefined,
					timeoutId:
						timeoutStrategy === "on-timer" && timeout
							? setTimeoutCancel(prompts, id, timeout)
							: undefined,
				});
			},
		);
	}

	// @ts-expect-error
	return prompt;
}

export function emitCancelError(prompts: PromptsType, id: number) {
	const prompt = prompts.get(id);
	if (prompt) {
		prompt.reject(new PromptCancelError("timeout"));
		prompts.delete(id);
	} else
		console.warn(
			`[Timeout] Prompt with id ${id} not found. Please share it with GramIO author.`,
		);
}
