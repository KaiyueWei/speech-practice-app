import { useState, useRef, useCallback } from 'react'

export function useMediaRecorder({ onStop } = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [permissionError, setPermissionError] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

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
      setIsRecording(false)
      onStop?.(blob)
      stream.getTracks().forEach(t => t.stop())
    })

    recorder.start()
    setIsRecording(true)
  }, [onStop])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  return { start, stop, isRecording, permissionError }
}