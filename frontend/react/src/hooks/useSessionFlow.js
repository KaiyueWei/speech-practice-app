import { useReducer } from 'react'

const INITIAL = { status: 'idle', feedback: null }

function reducer(state, action) {
  switch (action.type) {
    case 'START_RECORDING':
      return state.status === 'idle' ? { ...state, status: 'recording' } : state
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