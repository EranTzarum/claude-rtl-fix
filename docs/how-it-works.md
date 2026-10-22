# How it works

The mod hooks `ui.render` for the `AssistantMessage` and `UserMessage` rows and rewrites the text before it is drawn. Per line that holds Hebrew:

1. It puts a right-to-left mark (U+200F) after any list or heading marker.
2. It wraps each run of English in a left-to-right isolate: from the first Latin letter or digit to the last one before Hebrew, so a chain like `Authentication → Users → Send` or a range like `10–12` stays one run.
3. In a code block, a line that opens with Hebrew is wrapped in a right-to-left isolate. A line that opens with code (HTML, a command) is left as it is.

Lines without Hebrew, link targets and bare URLs are left as written. Inline code is isolated whole.

## Before sending

A `prompt.submit` hook removes every bidi mark and isolate (U+200E, U+200F, U+2066 to U+2069) from your prompt before it is sent. Text you copy from a drawn reply carries the mod's marks; this keeps them away from the model.

<details>
<summary>Limits</summary>

- **Copying:** the invisible marks are part of the drawn text. Copying a code line that contains Hebrew can carry them along. Lines without Hebrew are never touched.
- **Tables:** rows that start with `|` are skipped.
- **What the desktop app draws itself:** the prompt box, your own message bubbles and the quote-reply box. A mod cannot change their direction. A line that starts with Hebrew reads right to left there; one that starts with English does not.
- **Slash commands:** a prompt that runs a slash command is sent with its marks, because the engine does not take a rewrite there.
- **Display only:** the stored conversation and what the model reads stay as written.

</details>
