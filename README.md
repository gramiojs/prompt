# @gramio/prompt

Prompt plugin for [GramIO](https://gramio.netlify.app/).

## Usage

```ts
import { Bot } from "gramio";
import { prompt } from "@gramio/prompt";

const bot = new Bot(process.env.token!)
    .extend(prompt())
    .command("start", (context) => {
        const answer = await context.prompt("message", "What's your name?");

        return context.send(`✨ Your name is ${answer.text}`);
    })
    .onStart(console.log);

bot.start();
```

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
