import { createRef } from 'react'
import {
  AudioPlayer,
  AudioPlayerGroup,
  type AudioPlayerProps,
  type AudioPlayerState
} from '@cognitap/radiant'
const props: AudioPlayerProps = {
  src: '/clip.wav',
  playLabel: 'Play',
  pauseLabel: 'Pause',
  seekLabel: 'Seek',
  preload: 'none',
  errorText: 'This clip cannot be played.',
  onPlayingChange: (playing: boolean) => void playing,
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-audio-player-gap': '1rem' }
}
const state: AudioPlayerState = 'playing'
void state
;<AudioPlayerGroup>
  <AudioPlayer {...props} />
  <AudioPlayer
    compact
    playLabel="Play"
    pauseLabel="Pause"
    aria-label="Preview"
    src="/clip.wav"
  />
</AudioPlayerGroup>
// @ts-expect-error A compact player needs an accessible name.
;<AudioPlayer
  compact
  playLabel="Play"
  pauseLabel="Pause"
/>
// @ts-expect-error The full player needs a scrubber name.
;<AudioPlayer
  playLabel="Play"
  pauseLabel="Pause"
/>
const eager = {
  ...props,
  // @ts-expect-error Preload takes the native values only.
  preload: 'eager'
} satisfies AudioPlayerProps
void eager
