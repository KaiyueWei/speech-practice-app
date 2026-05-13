const STATUS_TEXT = {
  idle: 'Ready',
  recording: 'Recording…',
  transcribing: 'Transcribing…',
  done: 'Done',
}

function Waveform({ barHeights }) {
  return (
    <div className="waveform" aria-hidden="true">
      {barHeights.map((h, i) => (
        <div key={i} className="waveform-bar" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export default function RecordingSession({ sessionStatus, onRecord, onStop, barHeights }) {
  const isRecording = sessionStatus === 'recording'

  return (
    <div className="recording-session">
      <Waveform barHeights={barHeights} />
      <button
        type="button"
        onClick={isRecording ? onStop : onRecord}
      >
        {isRecording ? 'Stop recording' : 'Start recording'}
      </button>
      <div data-testid="status-bar" className="status-bar">
        {STATUS_TEXT[sessionStatus] ?? 'Ready'}
      </div>
    </div>
  )
}
