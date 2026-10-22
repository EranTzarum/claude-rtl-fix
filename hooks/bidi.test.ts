import { expect, test } from 'claude-code/testing'

import { fixBidi, unmarkDraft } from './bidi'

const RLM = '\u200F'
const LRI = '\u2066'
const PDI = '\u2069'

test('english only is untouched', () => {
  expect(fixBidi('hello world\n- item')).toBe('hello world\n- item')
})

test('hebrew only gets an RLM', () => {
  expect(fixBidi('שלום עולם')).toBe(`${RLM}שלום עולם`)
})

test('english starting a hebrew line is isolated and the line is RTL', () => {
  expect(fixBidi('Claude Code עובד מצוין')).toBe(`${RLM}${LRI}Claude Code${PDI} עובד מצוין`)
})

test('english in the middle is isolated, trailing punctuation stays outside', () => {
  expect(fixBidi('הרץ את git status.')).toBe(`${RLM}הרץ את ${LRI}git status${PDI}.`)
})

test('list marker stays first', () => {
  expect(fixBidi('- שלום world')).toBe(`- ${RLM}שלום ${LRI}world${PDI}`)
  expect(fixBidi('## כותרת')).toBe(`## ${RLM}כותרת`)
})

test('fence lines with hebrew get an RTL isolate, others stay', () => {
  const t = 'שלום\n```\nשלום foo\nls -la\n```\nשלום'
  expect(fixBidi(t)).toBe(
    `${RLM}שלום\n\`\`\`\n\u2067שלום ${LRI}foo${PDI}${PDI}\nls -la\n\`\`\`\n${RLM}שלום`,
  )
})

test('inline code is isolated whole, urls and link targets are kept', () => {
  expect(fixBidi('ראה `a b` כאן')).toBe(`${RLM}ראה ${LRI}\`a b\`${PDI} כאן`)
  expect(fixBidi('ראה https://x.com/a כאן')).toBe(`${RLM}ראה https://x.com/a כאן`)
  expect(fixBidi('[אתר](https://x.com)')).toBe(`${RLM}[אתר](https://x.com)`)
})

test('unmark removes every RLM and isolate', () => {
  expect(unmarkDraft(`${RLM}אחד\n${RLM}PR`)).toBe('אחד\nPR')
  expect(unmarkDraft(`\u2067${LRI}PR ${PDI} אחד${PDI}`)).toBe('PR  אחד')
})
