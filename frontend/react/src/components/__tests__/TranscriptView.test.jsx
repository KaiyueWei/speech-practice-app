import { render, screen } from '@testing-library/react'
import TranscriptView from '../TranscriptView'

describe('TranscriptView', () => {
  it('wraps filler words um, uh, like with class "filler"', () => {
    const { container } = render(
      <TranscriptView text="I um think uh that is like great" />
    )
    const fillers = container.querySelectorAll('.filler')
    const words = Array.from(fillers).map(el => el.textContent)
    expect(words).toContain('um')
    expect(words).toContain('uh')
    expect(words).toContain('like')
  })

  it('renders pause markers [pause Xs] as elements with class "pause-pill"', () => {
    const { container } = render(
      <TranscriptView text="This was [pause 2s] a good answer [pause 1s]" />
    )
    const pills = container.querySelectorAll('.pause-pill')
    expect(pills).toHaveLength(2)
    expect(pills[0]).toHaveTextContent('pause 2s')
    expect(pills[1]).toHaveTextContent('pause 1s')
  })

  it('renders plain text without modification when no fillers or pauses', () => {
    render(<TranscriptView text="Hello world this is great" />)
    expect(screen.getByText('Hello world this is great')).toBeInTheDocument()
  })
})