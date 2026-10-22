const RLM = '\u200F'
const LRI = '\u2066'
const RLI = '\u2067'
const PDI = '\u2069'

const HEBREW = /[\u0590-\u05FF]/
const MARKER = /^(\s*(?:>\s*)*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)?)/
const FENCE = /^\s*(```|~~~)/
// Spans left as written: link targets, bare URLs. Inline code is isolated whole.
const PROTECTED = /\]\([^)\s]*\)|https?:\/\/\S+/
const CODE = /`[^`\n]*`/
const LATIN_RUN = /[A-Za-z0-9][\w.\-/:@#%+=&?~]*(?: [A-Za-z0-9][\w.\-/:@#%+=&?~]*)*/g
const TRAILING_PUNCT = /[.:?\-/]+$/

const isolateLatin = (s: string) =>
  s.replace(LATIN_RUN, run => {
    const tail = TRAILING_PUNCT.exec(run)?.[0] ?? ''
    return `${LRI}${run.slice(0, run.length - tail.length)}${PDI}${tail}`
  })

const fixSegment = (s: string): string => {
  const hit = [CODE, PROTECTED]
    .map(re => ({ re, m: re.exec(s) }))
    .filter(x => x.m)
    .sort((a, b) => a.m!.index - b.m!.index)[0]
  if (!hit) return isolateLatin(s)
  const m = hit.m!
  const kept = hit.re === CODE ? `${LRI}${m[0]}${PDI}` : m[0]
  return isolateLatin(s.slice(0, m.index)) + kept + fixSegment(s.slice(m.index + m[0].length))
}

/** Forces a right-to-left base on every line that holds Hebrew, and keeps embedded English runs in order. */
export const fixBidi = (text: string): string => {
  if (!HEBREW.test(text)) return text
  let inFence = false
  return text
    .split('\n')
    .map(line => {
      if (FENCE.test(line)) {
        inFence = !inFence
        return line
      }
      if (!HEBREW.test(line)) return line
      // code lines have no markdown: an RTL isolate forces the base, Latin runs stay in order
      if (inFence) return RLI + isolateLatin(line) + PDI
      // shortcut: table rows are left alone, a `|` row has no single base direction; revisit if tables garble
      if (/^\s*\|/.test(line)) return line
      const marker = MARKER.exec(line)![1]
      return marker + RLM + fixSegment(line.slice(marker.length))
    })
    .join('\n')
}

/** The text with every bidi mark and isolate removed: marks copied from a drawn message. */
export const unmarkDraft = (text: string): string => text.replace(/[\u200E\u200F\u2066-\u2069]/g, '')
