const FILLER_RE = /\b(um|uh|like)\b/gi
const PAUSE_RE = /\[pause\s+[\d.]+s\]/gi

function parseSegments(text) {
  const segments = []
  const combined = new RegExp(`(${FILLER_RE.source}|${PAUSE_RE.source})`, 'gi')
  let last = 0
  let match

  while ((match = combined.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) })
    }
    const token = match[0]
    if (/^\[pause/i.test(token)) {
      segments.push({ type: 'pause', value: token.slice(1, -1) })
    } else {
      segments.push({ type: 'filler', value: token })
    }
    last = match.index + token.length
  }

  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) })
  }

  return segments
}

export default function TranscriptView({ text }) {
  const segments = parseSegments(text)

  if (segments.length === 1 && segments[0].type === 'text') {
    return <p className="transcript">{text}</p>
  }

  return (
    <p className="transcript">
      {segments.map((seg, i) => {
        if (seg.type === 'filler') {
          return <span key={i} className="filler">{seg.value}</span>
        }
        if (seg.type === 'pause') {
          return <span key={i} className="pause-pill">{seg.value}</span>
        }
        return seg.value
      })}
    </p>
  )
}