import { FormattableString } from "gramio";
import type {
	EventsUnion,
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
} from "types.ts";

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
	maybeEvent: EventsUnion | Stringable,
): maybeEvent is EventsUnion {
	return events.includes(maybeEvent.toString() as EventsUnion);
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
		eventOrValidate?: Event | ValidateFunction<Event>,
		validateOrOptions?:
			| ValidateFunction<Event>
			| {
					validate?: ValidateFunction<Event>;
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
		event: EventsUnion,
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

		const transform =
			typeof validateOrOptions === "object"
				? validateOrOptions.transform
				: undefined;
		const validate =
			typeof validateOrOptions === "object"
				? validateOrOptions.validate
				: undefined;
		const onValidateError =
			typeof validateOrOptions === "object"
				? validateOrOptions.onValidateError
				: undefined;

		return new Promise<[PromptAnswer<Event>, ActionReturn]>((resolve) => {
			prompts.set(id, {
				// @ts-expect-error
				resolve: resolve,
				event,
				validate: validate,
				// @ts-expect-error
				transform: async (context) => {
					const transformedContext = transform
						? // @ts-expect-error
							await transform(context)
						: context;

					return [transformedContext, actionReturn];
				},
				onValidateError: onValidateError,
			});
		});
	}

	// @ts-ignore
	return prompt;
}
