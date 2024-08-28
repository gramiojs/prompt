# @gramio/prompt

[![npm](https://img.shields.io/npm/v/@gramio/prompt?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/@gramio/prompt)
[![JSR](https://jsr.io/badges/@gramio/prompt)](https://jsr.io/@gramio/prompt)
[![JSR Score](https://jsr.io/badges/@gramio/prompt/score)](https://jsr.io/@gramio/prompt)

A plugin for [GramIO](https://gramio.dev/) that provides [Prompt](#prompt) and [Wait](#wait) methods

Read about [Plugin options](https://jsr.io/@gramio/prompt@0.1.0/doc/~/prompt#parameters)

## Usage

```ts
import { Bot, format, bold } from "gramio";
import { prompt } from "@gramio/prompt";

const bot = new Bot(process.env.TOKEN as string)
    .extend(prompt())
    .command("start", async (context) => {
        const answer = await context.prompt(
            "message",
            format`What's your ${bold`name`}?`
        );

        return context.send(`✨ Your name is ${answer.text}`);
    })
    .onStart(console.log);

bot.start();
```

## Prompt

### Prompt with text + params

```ts
const answer = await context.prompt("What's your name?");
// or with SendMessageParams
const answer = await context.prompt("True or false?", {
    reply_markup: new Keyboard().text("true").row().text("false"),
});
```

answer is `MessageContext` or `CallbackQueryContext`

### Prompt with text + params and the specified event

```ts
const answer = await context.prompt("message", "What's your name?");

const answer = await context.prompt("callback_query", "True or false?", {
    reply_markup: new InlineKeyboard()
        .text("true", "true")
        .row()
        .text("false", "false"),
});
```

answer is `CallbackQueryContext`

### Validation

You can define a handler in params to validate the user's answer.
If handler returns false, the message will be repeated.

```ts
const answer = await context.prompt(
    "message",
    "Enter a string that contains russian letter",
    {
        validate: (context) => /[а-яА-Я]/.test(context.text),
        //... and some SendMessageParams
    }
);
```

### Transform

```ts
const name = await context.prompt(
    "message",
    format`What's your ${bold`name`}?`,
    {
        transform: (context) => context.text || context.caption || "",
    }
);
```

name is `string`

## Wait

### Wait for the next event from the user

```ts
const answer = await context.wait();
```

answer is `MessageContext` or `CallbackQueryContext`

### Wait for the next event from the user ignoring events not listed

```ts
const answer = await context.wait("message");
```

answer is `CallbackQueryContext`

### Wait for the next event from the user ignoring non validated answers

You can define a handler in params to validate the user's answer.
If handler return `false`, the **message** will be ignored

```ts
const answer = await context.wait((context) => /[а-яА-Я]/.test(context.text));
// or combine with event
const answer = await context.wait("message", (context) =>
    /[а-яА-Я]/.test(context.text)
);
```

### Wait for the next event from the user ignoring non validated answers with transformer

You can define a handler in params to **transform** the user's answer.

```ts
const answer = await context.wait((context) => /[а-яА-Я]/.test(context.text));
// or combine with event
const answer = await context.wait("message", {
    validate: (context) => /[а-яА-Я]/.test(context.text),
    transform: (context) => c.text || "",
});
```

answer is `string`
