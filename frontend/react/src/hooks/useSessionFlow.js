import { useReducer } from 'react'

const INITIAL = { status: 'idle', feedback: null }

function reducer(state, action) {
  switch (action.type) {
    case 'START_RECORDING':
      // Allow starting from any terminal-ish state so the user can record again
      // after a completed or stalled session without manual reset.
      return state.status === 'recording'
        ? state
        : { status: 'recording', feedback: null }
    case 'STOP_RECORDING':
      return state.status === 'recording' ? { ...state, status: 'transcribing' } : state
    case 'SET_FEEDBACK':
      return (state.status === 'transcribing' || state.status === 'recording')
        ? { status: 'done', feedback: action.payload }
        : state
    case 'RESET':
      return INITIAL
    default:
      return state
  }
}

export function useSessionFlow() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  return {
    status: state.status,
    feedback: state.feedback,
    startRecording: () => dispatch({ type: 'START_RECORDING' }),
    stopRecording: () => dispatch({ type: 'STOP_RECORDING' }),
    setFeedback: (payload) => dispatch({ type: 'SET_FEEDBACK', payload }),
    reset: () => dispatch({ type: 'RESET' }),
  }
}