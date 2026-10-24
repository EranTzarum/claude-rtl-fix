const RLM = '\u200F'
const LRI = '\u2066'
const RLI = '\u2067'
const PDI = '\u2069'

const HEBREW = /[\u0590-\u05FF]/
const FIRST_STRONG = /[A-Za-z\u0590-\u05FF]/
const MARKER = /^(\s*(?:>\s*)*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)?)/
const FENCE = /^\s*(```|~~~)/
// Spans left as written: link targets, bare URLs. Inline code is isolated whole.
const PROTECTED = /\]\([^)\s]*\)|https?:\/\/\S+/
const CODE = /`[^`\n]*`/
// From the first Latin letter or digit to the last one before Hebrew, so a chain like
// `A → B → C` or `**A** / **B**` stays one left-to-right run and its arrows keep pointing forward.
// A `←` ends a run: `A ← B ← C` is written to be read right to left, so each item is its own run
const LATIN_RUN = /[A-Za-z0-9](?:[^\u0590-\u05FF\n←]*[A-Za-z0-9])?/g

const isolateLatin = (s: string) => s.replace(LATIN_RUN, run => `${LRI}${run}${PDI}`)

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
      if (inFence) {
        // A code line that opens with Hebrew is a sentence: RTL, Latin runs kept in order.
        // One that opens with code (HTML, a command) stays left to right; its Hebrew strings read fine there.
        const isHebrewFirst = HEBREW.test(FIRST_STRONG.exec(line)![0])
        return isHebrewFirst ? RLI + isolateLatin(line) + PDI : line
      }
      // shortcut: table rows are left alone, a `|` row has no single base direction; revisit if tables garble
      if (/^\s*\|/.test(line)) return line
      const marker = MARKER.exec(line)![1]
      return marker + RLM + fixSegment(line.slice(marker.length))
    })
    .join('\n')
}

/** The text with every bidi mark and isolate removed: marks copied from a drawn message. */
export const unmarkDraft = (text: string): string => text.replace(/[\u200E\u200F\u2066-\u2069]/g, '')
