import { type BotLike, type ContextType, FormattableString } from "gramio";
import type {
	EventsUnion,
	MaybeArray,
	OnValidateErrorFunction,
	PromptAnswer,
	PromptFunction,
	PromptFunctionParams,
	PromptsType,
	Stringable,
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

		const message = await context.send(text, sendParams);

		const events = isEvent(eventOrText) ? eventOrText : undefined;

		return new Promise<PromptAnswer<Event, Data>>((resolve) => {
			prompts.set(id, {
				actionReturn: message,
				resolve: resolve,
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

export function getWait(prompts: PromptsType, id: number): WaitFunction {
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
			  },
	) {
		const events =
			eventOrValidate &&
			typeof eventOrValidate !== "function" &&
			isEvent(eventOrValidate)
				? eventOrValidate
				: undefined;

		return new Promise<PromptAnswer<Event>>((resolve) => {
			prompts.set(id, {
				resolve: resolve,
				events: Array.isArray(events) ? events : events ? [events] : undefined,
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
			  },
	) {
		const actionReturn = await action();

		const options = deepMerge(
			defaults,
			typeof validateOrOptions === "function"
				? {
						validate: validateOrOptions,
					}
				: validateOrOptions ?? {},
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

		return new Promise<[PromptAnswer<Event>, ActionReturn]>((resolve) => {
			prompts.set(id, {
				actionReturn,
				resolve: resolve,
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
			});
		});
	}

	// @ts-expect-error
	return prompt;
}
