import type { Register } from 'claude-code'

import { fixBidi, markDraft, unmarkDraft } from './bidi'

const RLM = '‏'

export const register: Register = on => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const text = fixBidi(e.props.text)
    return text === e.props.text ? next(e) : next({ ...e, props: { ...e.props, text } })
  })

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    const text = fixBidi(e.props.text)
    return text === e.props.text ? next(e) : next({ ...e, props: { ...e.props, text } })
  })

  on('prompt.edit', async ($, e, next) => {
    // Backspace onto a line's RLM deletes the character before it too, so the person can still join lines
    const isMarkDeleted = e.inputText === '' && e.end - e.start === 1 && e.text[e.start] === RLM
    const r = await next(isMarkDeleted ? { ...e, start: Math.max(0, e.start - 1) } : e)
    // shortcut: a box another plugin painted keeps its offsets unmarked; shift decorations if one shows up
    if (r.decorations?.length) return r
    return { ...r, ...markDraft(r.text, r.cursor) }
  })

  // The RLM marks are for the box alone: the model reads the prompt as typed
  on('prompt.submit', ($, e, next) =>
    e.command || unmarkDraft(e.text) === e.text ? next(e) : next({ ...e, text: unmarkDraft(e.text) }),
  )
}
