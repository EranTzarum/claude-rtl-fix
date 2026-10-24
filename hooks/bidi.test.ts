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

test('a chain of english steps is one LTR run, arrows and bold markers included', () => {
  expect(fixBidi('בתפריט Authentication → Users → Add user → Send, ושלח')).toBe(
    `${RLM}בתפריט ${LRI}Authentication → Users → Add user → Send${PDI}, ושלח`,
  )
  expect(fixBidi('בתפריט **Authentication** → **Users** עכשיו')).toBe(
    `${RLM}בתפריט **${LRI}Authentication** → **Users${PDI}** עכשיו`,
  )
})

test('numbers keep their order, brackets stay outside the run', () => {
  expect(fixBidi('צעדים (10–12) שוב')).toBe(`${RLM}צעדים (${LRI}10–12${PDI}) שוב`)
})

test('a code line that opens with code stays LTR, one that opens with hebrew goes RTL', () => {
  const t = '```\n<div dir="rtl"><h2>קוד הכניסה שלך</h2>\nהרץ את npm test\n```'
  expect(fixBidi(t)).toBe(
    `\`\`\`\n<div dir="rtl"><h2>קוד הכניסה שלך</h2>\n\u2067הרץ את ${LRI}npm test${PDI}${PDI}\n\`\`\``,
  )
})

test('a chain with ← arrows reads right to left: each item is its own run', () => {
  expect(fixBidi('ב-developer.apple.com ← Certificates, IDs & Profiles ← **Services** בתפריט')).toBe(
    `${RLM}ב-${LRI}developer.apple.com${PDI} ← ${LRI}Certificates, IDs & Profiles${PDI} ← **${LRI}Services${PDI}** בתפריט`,
  )
  expect(fixBidi('**Next** ← **Register** ואז')).toBe(`${RLM}**${LRI}Next${PDI}** ← **${LRI}Register${PDI}** ואז`)
})
