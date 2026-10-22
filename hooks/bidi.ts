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

/**
 * The prompt box's draft with an RLM opening each line that holds Hebrew, and none on a line without;
 * the cursor moved by what was added or removed before it.
 */
export const markDraft = (text: string, cursor: number): { text: string; cursor: number } => {
  let pos = 0
  let moved = cursor
  const lines = text.split('\n').map(line => {
    const start = pos
    pos += line.length + 1
    const hasHebrew = HEBREW.test(line)
    const isMarked = line.startsWith(RLM)
    if (hasHebrew && !isMarked) {
      if (cursor >= start) moved += 1
      return RLM + line
    }
    if (!hasHebrew && isMarked) {
      if (cursor > start) moved -= 1
      return line.slice(1)
    }
    return line
  })
  return { text: lines.join('\n'), cursor: moved }
}

/** The text with every bidi mark and isolate removed: the box's RLMs, and marks copied from a drawn message. */
export const unmarkDraft = (text: string): string => text.replace(/[‎‏⁦-⁩]/g, '')
