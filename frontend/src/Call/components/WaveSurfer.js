/**
 * A React component for wavesurfer.js
 *
 * Usage:
 *
 * import WavesurferPlayer from '@wavesurfer/react'
 *
 * <WavesurferPlayer
 *   url="/my-server/audio.ogg"
 *   waveColor="purple"
 *   height={100}
 *   onReady={(wavesurfer) => console.log('Ready!', wavesurfer)}
 * />
 */

import { set } from 'date-fns'
import { useState, useMemo, useEffect, useRef, memo } from 'react'
import WaveSurfer from 'wavesurfer.js'

/**
 * Use wavesurfer instance
 */
function useWavesurferInstance(containerRef, options) {
  const [wavesurfer, setWavesurfer] = useState(null)
  // Flatten options object to an array of keys and values to compare them deeply in the hook deps
  const flatOptions = useMemo(() => Object.entries(options).flat(), [options])

  // Create a wavesurfer instance
  useEffect(() => {
    if (!containerRef.current) return

    const ws = WaveSurfer.create({
      ...options,
      container: containerRef.current,
    })

    setWavesurfer(ws)

    return () => {
      console.log('destroying wavesurfer')
      ws.destroy()
    }
  }, [containerRef, ...flatOptions])

  return wavesurfer
}

/**
 * Use wavesurfer state
 */
function useWavesurferState(wavesurfer) {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [hasFinished, setHasFinished] = useState(false)

  useEffect(() => {
    if (!wavesurfer) return

    const unsubscribeFns = [
      wavesurfer.on('load', () => {
        setIsReady(false)
        setIsPlaying(false)
        setCurrentTime(0)
      }),

      wavesurfer.on('ready', () => {
        setIsReady(true)
        setIsPlaying(false)
        setHasFinished(false)
        setCurrentTime(0)
      }),

      wavesurfer.on('finish', () => {
        setHasFinished(true)
    }),

      wavesurfer.on('play', () => {
        setIsPlaying(true)
      }),

      wavesurfer.on('pause', () => {
        setIsPlaying(false)
      }),

      wavesurfer.on('timeupdate', () => {
        setCurrentTime(wavesurfer.getCurrentTime())
      }),

      wavesurfer.on('destroy', () => {
        setIsReady(false)
        setIsPlaying(false)
      }),
    ]

    return () => {
      unsubscribeFns.forEach((fn) => fn())
    }
  }, [wavesurfer])

  return useMemo(
    () => ({
      isReady,
      isPlaying,
      currentTime,
      hasFinished
    }),
    [isPlaying, currentTime, isReady, hasFinished],
  )
}

const EVENT_PROP_RE = /^on([A-Z])/
const isEventProp = (key) => EVENT_PROP_RE.test(key)
const getEventName = (key) => key.replace(EVENT_PROP_RE, (_, $1) => $1.toLowerCase())

/**
 * Parse props into wavesurfer options and events
 */
function useWavesurferProps(props) {
  // Props starting with `on` are wavesurfer events, e.g. `onReady`
  // The rest of the props are wavesurfer options
  return useMemo(() => {
    const allOptions = { ...props }
    const allEvents = { ...props }

    for (const key in allOptions) {
      if (isEventProp(key)) {
        delete allOptions[key]
      } else {
        delete allEvents[key]
      }
    }
    return [allOptions, allEvents]
  }, [props])
}

/**
 * Subscribe to wavesurfer events
 */
function useWavesurferEvents(wavesurfer, events) {
  const flatEvents = useMemo(() => Object.entries(events).flat(), [events])

  // Subscribe to events
  useEffect(() => {
    if (!wavesurfer) return

    const eventEntries = Object.entries(events)
    if (!eventEntries.length) return

    const unsubscribeFns = eventEntries.map(([name, handler]) => {
      const event = getEventName(name)
      return wavesurfer.on(event, (...args) => handler(wavesurfer, ...args))
    })

    return () => {
      unsubscribeFns.forEach((fn) => fn())
    }
  }, [wavesurfer, ...flatEvents])
}

/**
 * Wavesurfer player component
 * @see https://wavesurfer.xyz/docs/modules/wavesurfer
 */
const WavesurferPlayer = memo((props) => {
  const containerRef = useRef(null)
  const [options, events] = useWavesurferProps(props)
  const wavesurfer = useWavesurferInstance(containerRef, options)
  useWavesurferEvents(wavesurfer, events)

  // Create a container div
  return <div ref={containerRef} />
})

export default WavesurferPlayer

/**
 * React hook for wavesurfer.js
 *
 * ```
 * import { useWavesurfer } from '@wavesurfer/react'
 *
 * const App = () => {
 *   const containerRef = useRef(null)
 *
 *   const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
 *     container: containerRef,
 *     url: '/my-server/audio.ogg',
 *     waveColor: 'purple',
 *     height: 100',
 *   })
 *
 *   return <div ref={containerRef} />
 * }
 * ```
 */
export function useWavesurfer({ container, ...options }) {
  const wavesurfer = useWavesurferInstance(container, options)
  const state = useWavesurferState(wavesurfer)
  return useMemo(() => ({ ...state, wavesurfer }), [state, wavesurfer])
}