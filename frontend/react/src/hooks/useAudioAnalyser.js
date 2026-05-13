import { useState, useEffect, useRef } from 'react'

const BAR_COUNT = 80

const ZERO_BARS = Array(BAR_COUNT).fill(0)

export function useAudioAnalyser(stream) {
  const [barHeights, setBarHeights] = useState(ZERO_BARS)
  const rafRef = useRef(null)
  const ctxRef = useRef(null)

  useEffect(() => {
    if (!stream) {
      setBarHeights(ZERO_BARS)
      return
    }

    const audioCtx = new AudioContext()
    ctxRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const draw = () => {
      analyser.getByteFrequencyData(dataArray)

      const step = Math.floor(dataArray.length / BAR_COUNT)
      const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const value = dataArray[i * step] ?? 0
        return Math.round((value / 255) * 100)
      })

      setBarHeights(bars)
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      analyser.disconnect()
      audioCtx.close()
    }
  }, [stream])

  return { barHeights }
}