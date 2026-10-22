import type { Register } from 'claude-code'

import { fixBidi, unmarkDraft } from './bidi'

export const register: Register = on => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const text = fixBidi(e.props.text)
    return text === e.props.text ? next(e) : next({ ...e, props: { ...e.props, text } })
  })

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    const text = fixBidi(e.props.text)
    return text === e.props.text ? next(e) : next({ ...e, props: { ...e.props, text } })
  })

  // The desktop prompt box ignores prompt.edit's answer, so it is not hooked. Marks copied from a drawn
  // message are removed here: the model reads the prompt as typed
  on('prompt.submit', ($, e, next) =>
    e.command || unmarkDraft(e.text) === e.text ? next(e) : next({ ...e, text: unmarkDraft(e.text) }),
  )
}
