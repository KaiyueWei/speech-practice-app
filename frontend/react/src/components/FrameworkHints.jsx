import { useState } from 'react'

const TABS = {
  STAR: {
    label: 'STAR',
    content: 'Situation → Task → Action → Result. Describe the situation and task clearly, focus on your specific actions, and quantify the result.',
  },
  PREP: {
    label: 'PREP',
    content: 'Point → Reason → Example → Point. Lead with your main point, support it with a reason, give a concrete example, then restate your point.',
  },
  PPF: {
    label: 'PPF',
    content: 'Past → Present → Future. Start with relevant past experience, connect it to your current skills, then explain how it informs your future goals.',
  },
  MECE: {
    label: 'MECE',
    content: 'Mutually Exclusive, Collectively Exhaustive. Structure your answer so each point is distinct and together they cover the full picture.',
  },
}

export default function FrameworkHints() {
  const [active, setActive] = useState('STAR')

  return (
    <div className="framework-hints">
      <div role="tablist">
        {Object.keys(TABS).map(key => (
          <button
            key={key}
            role="tab"
            aria-selected={active === key ? 'true' : 'false'}
            onClick={() => setActive(key)}
          >
            {TABS[key].label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{TABS[active].content}</div>
    </div>
  )
}
