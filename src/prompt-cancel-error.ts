export class PromptCancelError extends Error {
    constructor(public readonly type: "timeout" | "cancel") {
        super(type);
    }
}

