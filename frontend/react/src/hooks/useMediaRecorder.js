import { useState, useRef, useCallback } from 'react'

export function useMediaRecorder({ onStop } = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [permissionError, setPermissionError] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(null)

  const start = useCallback(async () => {
    setPermissionError(false)
    chunksRef.current = []

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setPermissionError(true)
      return
    }

    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder

    recorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    })

    recorder.addEventListener('stop', () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const durationSec = startTimeRef.current
        ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        : null
      setIsRecording(false)
      onStop?.(blob, durationSec)
      stream.getTracks().forEach(t => t.stop())
    })

    startTimeRef.current = Date.now()
    recorder.start()
    setIsRecording(true)
  }, [onStop])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  return { start, stop, isRecording, permissionError }
}
