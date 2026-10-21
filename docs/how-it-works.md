# How it works

The mod hooks `ui.render` for the `AssistantMessage` and `UserMessage` rows and rewrites the text before it is drawn. Per line that holds Hebrew:

1. It puts a right-to-left mark (U+200F) after any list or heading marker.
2. It wraps each run of English words, numbers and paths in a left-to-right isolate.
3. In a code block it wraps the whole line in a right-to-left isolate instead.

Lines without Hebrew, link targets and bare URLs are left as written. Inline code is isolated whole.

<details>
<summary>Limits</summary>

- **Copying:** the invisible marks are part of the drawn text. Copying a code line that contains Hebrew can carry them along. Lines without Hebrew are never touched.
- **Tables:** rows that start with `|` are skipped.
- **Prompt box:** the field you type in is not drawn by a mod, so its direction does not change.
- **Display only:** the stored conversation and what the model reads stay as written.

</details>
