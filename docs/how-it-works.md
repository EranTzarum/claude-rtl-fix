# How it works

The mod hooks `ui.render` for the `AssistantMessage` and `UserMessage` rows and rewrites the text before it is drawn. Per line that holds Hebrew:

1. It puts a right-to-left mark (U+200F) after any list or heading marker.
2. It wraps each run of English words, numbers and paths in a left-to-right isolate.
3. In a code block it wraps the whole line in a right-to-left isolate instead.

Lines without Hebrew, link targets and bare URLs are left as written. Inline code is isolated whole.

## The prompt box

The mod hooks `prompt.edit`, which runs on every key or paste in the box. After each edit it puts a right-to-left mark (U+200F) at the start of every line that holds Hebrew, and removes it from a line that no longer does. The cursor moves with what was added. Backspace onto a line's mark deletes the character before it too, so you can still join two lines.

A `prompt.submit` hook removes every bidi mark and isolate (U+200E, U+200F, U+2066 to U+2069) before the prompt is sent, so the model reads the text as typed. That also cleans marks copied from a drawn message.

<details>
<summary>Limits</summary>

- **Copying:** the invisible marks are part of the drawn text. Copying a code line that contains Hebrew can carry them along. Lines without Hebrew are never touched.
- **Tables:** rows that start with `|` are skipped.
- **Prompt box alignment:** the words are in the right order, but the box stays left-aligned. A mod gets the text and the cursor, not the layout.
- **Slash commands:** a prompt that runs a slash command is sent with its marks, because the engine does not take a rewrite there.
- **Display only:** for messages, the stored conversation and what the model reads stay as written.

</details>
