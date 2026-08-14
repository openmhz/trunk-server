import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Menu,
  Icon,
  Progress,
  Label,
  Grid,
  GridRow,
  Header,
  Popup,
  GridColumn,
  LabelGroup,
  Button
} from "semantic-ui-react";
import ReactAudioPlayer from 'react-audio-player'
import { useWavesurfer } from '@wavesurfer/react'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';


import { is } from "date-fns/locale";
import "./MediaPlayer.css";

// WaveSurfer downloads the audio itself to draw the waveform, and fetch
// defaults to credentials: "same-origin". Playback goes through a gated
// endpoint on the api subdomain - a different origin - so without this the
// request carries no session cookie and comes back 401.
//
// Declared out here, not inline on the element: @wavesurfer/react rebuilds its
// create/destroy effect from Object.entries(options).flat(), so every option is
// compared by identity. A fresh object literal on each render destroys and
// recreates the player every render, which shows up as a flashing play button
// and the same call repeating. Same reason `plugins` below is memoized.
const FETCH_PARAMS = { credentials: "include" };

// Temporary: tags each WaveSurfer instance so the console shows whether a
// duplicate event comes from one instance bound twice or from two live players.
let INSTANCE_COUNT = 0;




const MediaPlayer = (props) => {
  const audioRef = React.createRef();
  const call = props.call;
  const [volume, setVolume] = useState(1);
  const [sourceIndex, setSourceIndex] = useState(0);
  const waveformContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTime, setPlayTime] = useState(0);
  const playSilence = props.playSilence;
  const parentHandlePlayPause = props.onPlayPause
  // A fresh plugin per call, because the player is rebuilt per call.
  //
  // Changing the url makes @wavesurfer/react destroy the WaveSurfer instance
  // and create a new one, and WaveSurfer.destroy() destroys its registered
  // plugins too - the plugin ends up with isDestroyed set and its wavesurfer
  // reference cleared. A plugin memoized once for the component's lifetime is
  // therefore dead from the second call onwards, and onReady below then throws
  // calling clearRegions() on it. The symptom is that exactly one call plays
  // per page load and nothing plays again until a refresh.
  //
  // Keyed on the call id rather than [] so the plugin is recreated in step with
  // the instance that owns it. Still stable across re-renders of the same call,
  // which matters because plugins is one of the options compared by identity.
  const callId = call ? call._id : null;
  // One plugin for the life of the component, because the WaveSurfer instance
  // is now also created once and never rebuilt - see the load effect below.
  // Nothing destroys it, so nothing invalidates the plugin.
  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);
  const plugins = useMemo(() => [regionsPlugin], [regionsPlugin]);

  // Which call is current, readable from inside a handler that closed over an
  // older one. Destroying a player makes it emit pause and finish on the way
  // out, and those late events were reaching the parent and setting state
  // during teardown - which forced a synchronous re-render that rebuilt the
  // player while it was still fetching the next call, aborting the load. A
  // handler whose call is no longer current is reporting on a player that no
  // longer exists, so it has nothing useful to say.
  const currentCallIdRef = useRef(null);
  currentCallIdRef.current = callId;
  const isStale = (id) => id !== currentCallIdRef.current;

  // The element that actually plays the audio - see the playback section below.
  const audioElRef = useRef(null);

  // Created once, via the hook rather than the WavesurferPlayer component.
  //
  // The component takes the audio url as a prop, and changing that prop makes
  // it destroy and rebuild WaveSurfer - which aborts the download it needs to
  // draw from, so no waveform appeared after the first call. Dropping the url
  // prop stopped the rebuilds but broke it differently: the instance was only
  // ever captured in the ready event, and with nothing to load ready never
  // fired, so it was never captured at all.
  //
  // The hook hands over the instance as soon as it exists, independent of any
  // load, which is what this needs: one long-lived player that each call is
  // loaded into.
  const { wavesurfer } = useWavesurfer({
    container: waveformContainerRef,
    height: 25,
    barWidth: 3,
    barGap: 3,
    barRadius: 6,
    waveColor: "#E81B39",
    // Display only - the audio element makes the sound.
    autoplay: false,
    fetchParams: FETCH_PARAMS,
    plugins,
  });

  // Playback is owned by a plain audio element, not by WaveSurfer.
  //
  // Left to itself WaveSurfer fetches and decodes the audio to draw the
  // waveform, and playback rides on that same fetch - so any rebuild of the
  // player aborts the download and the call goes silent. That is the failure
  // this component has been stuck on: the audio was fine, the fetch kept being
  // cancelled underneath it.
  //
  // Handing it a media element inverts that. The element loads and plays the
  // audio itself, natively and with cookies attached, and WaveSurfer attaches
  // to it for display. If the waveform fetch is interrupted the worst outcome
  // is a missing waveform - the audio keeps playing.
  //
  // One element for the life of the component: it is an option compared by
  // identity, so a new one each render would rebuild the player constantly.
  const mediaEl = useMemo(() => {
    if (typeof Audio === "undefined") return undefined;
    const el = new Audio();
    el.preload = "auto";
    return el;
  }, []);


  useEffect(() => {
    setSourceIndex(0);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Waiting for Call...",
        album: process.env.REACT_APP_SITE_NAME,
        artwork: [
          { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }

    wavesurfer && wavesurfer.load("/silence.m4a");
    regionsPlugin.clearRegions();

    // // In browsers that don’t yet support this functionality,
    // // playPromise won’t be defined.
    // if (playPromise !== undefined) {
    //   playPromise.then(function () {

    //   }).catch(function (error) {
    //     console.log("Automatic playback failed: " + error);
    //     // Show a UI element to let the user manually start playback.
    //   });
    // } else {
    //   audio.src = false;
    // }

  }, [playSilence]);

  useEffect(() => {
    setSourceIndex(0);
  }, [call]);

  useEffect(() => {
    // Volume belongs to the element that actually makes sound.
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
    }
    if (wavesurfer) {
      wavesurfer.setVolume(0);
    }
  }, [volume, wavesurfer]);

  // Loads each call into the existing waveform instead of rebuilding the
  // player. Passing url as a prop made the wrapper destroy and recreate
  // WaveSurfer for every call, and the destroy aborted the download it needed
  // to draw from - so only the first call ever got a waveform. Reloading the
  // same instance leaves nothing to abort.
  const loadedWaveformUrlRef = useRef(null);
  useEffect(() => {
    if (!wavesurfer || !call || !call.url) return;

    // Only load when the audio actually changes. useWavesurfer keeps its own
    // currentTime state and updates it on every timeupdate, and the cursor sync
    // drives timeupdate several times a second - so this effect re-ran
    // constantly, and each load aborted the one before it. The waveform never
    // finished decoding, which is why it did not match the audio.
    if (loadedWaveformUrlRef.current === call.url) return;

    const requested = call.url;
    loadedWaveformUrlRef.current = requested;
    console.log("[player] waveform load  call=" + call._id);

    try {
      const result = wavesurfer.load(requested);
      if (result && typeof result.catch === "function") {
        result.catch((err) => {
          // Clear the marker so this call can be drawn again. Marking it loaded
          // up front and leaving it there meant a failed or superseded load was
          // never retried, and the waveform kept showing whichever call last
          // succeeded - which is why every call appeared to have the same one.
          if (loadedWaveformUrlRef.current === requested) {
            loadedWaveformUrlRef.current = null;
          }
          console.warn("[player] waveform load did not finish: " + (err && err.message ? err.message : err));
        });
      }
    } catch (err) {
      if (loadedWaveformUrlRef.current === requested) {
        loadedWaveformUrlRef.current = null;
      }
      console.warn("[player] waveform load failed: " + err);
    }
  }, [wavesurfer, call]);


  // Every handler below is wrapped in useCallback, and that is load-bearing
  // rather than an optimisation. @wavesurfer/react rebuilds its event-binding
  // effect from the handler identities, so handlers recreated on each render
  // make it unbind and rebind continuously - and the bindings were observably
  // ending up doubled, firing play and finish twice per call. A duplicated
  // finish advances the playlist twice, and the second advance tore down the
  // player while it was still loading the next call, which surfaced as
  // "AbortError: signal is aborted without reason" and no audio.
  const onReady = useCallback((ws) => {
    if (ws && !ws.__tag) { ws.__tag = "ws" + (++INSTANCE_COUNT); }
    console.log("[player] ready  " + (ws && ws.__tag) + "  call=" + (call ? call._id : "none") + "  duration=" + (ws && ws.getDuration ? ws.getDuration().toFixed(2) : "?"));
    // The instance comes from the hook now, so there is nothing to capture here.
    // Drawing the source markers must never be able to stop the audio, so any
    // failure costs the markers rather than playback.
    try {
      regionsPlugin.clearRegions();
      if (call) {
        call.srcList.forEach(src => {
          regionsPlugin.addRegion({
            start: src.pos,
            color: "rgba(128, 128, 128, 1.0)",
            drag: false,
            resize: false
          });
        });
      }
    } catch (err) {
      console.error("[player] regions failed (playback continues): " + err);
    }
  }, [call, regionsPlugin]);

  // Temporary instrumentation while playback is being diagnosed.
  const onLoad = useCallback(() => {
    console.log("[player] load   call=" + (call ? call._id : "none") + "  url=" + (call ? call.url : "-"));
  }, [call]);
  const onError = useCallback((ws, err) => {
    console.error("[player] ERROR  call=" + (call ? call._id : "none") + "  " + err);
  }, [call]);

  const onEnded = props.onEnded;
  const onFinishLogged = useCallback((ws) => {
    const myCall = call ? call._id : null;
    if (isStale(myCall)) {
      console.log("[player] finish IGNORED (stale) " + (ws && ws.__tag) + "  call=" + myCall);
      return;
    }
    // Deliberately does not advance the playlist. The audio element owns
    // playback and reports the end of a call; WaveSurfer only draws. Letting
    // both report would advance twice.
    console.log("[player] waveform finish " + (ws && ws.__tag) + "  call=" + myCall);
  }, [call, onEnded]);

  const onPlay = useCallback((ws) => {
    console.log("[player] play   " + (ws && ws.__tag) + "  call=" + (call ? call._id : "none"));
    setIsPlaying(true);
    // Deferred for the same reason as onPause below.
    setTimeout(() => parentHandlePlayPause(true), 0);

  }, [call, parentHandlePlayPause]);

  const onPause = useCallback(() => {
    // A player emits pause as it is destroyed, and this runs inside that event.
    // Telling the parent synchronously here made React re-render during the
    // commit that was building the next player, which destroyed it while its
    // fetch was still in flight - "AbortError: signal is aborted without
    // reason", and no audio from the second call onwards.
    //
    // Deferring to the next task lets the current commit finish first. The
    // state still updates, just not in the middle of the player being built.
    if (isStale(call ? call._id : null)) {
      return;
    }
    setIsPlaying(false);
    setTimeout(() => parentHandlePlayPause(false), 0);
  }, [call, parentHandlePlayPause]);
  // ---------------------------------------------------------------------
  // Playback.
  //
  // This is a plain audio element that React owns, and it is the only thing
  // that plays sound. WaveSurfer draws the waveform and nothing else.
  //
  // WaveSurfer downloads and decodes the audio itself in order to draw, and
  // when playback rode on that same fetch, every rebuild of the player
  // cancelled the download and the call went silent. Nothing can cancel this:
  // the element has a src and plays it. If the waveform fetch is interrupted
  // the cost is a missing picture.
  // ---------------------------------------------------------------------

  const onPlayPause = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(err => console.warn("[player] play rejected: " + err));
    } else {
      el.pause();
    }
  }

  const onAudioPlay = () => {
    console.log("[player] audio play   call=" + (call ? call._id : "none"));
    setIsPlaying(true);
    setTimeout(() => parentHandlePlayPause(true), 0);
  }

  const onAudioPause = () => {
    const myCall = call ? call._id : null;
    setIsPlaying(false);
    // Deferred, so by the time this runs the next call may already be playing.
    // Reporting "paused" then would tell the parent nothing is playing while it
    // is, and the parent uses that to decide whether to accept an incoming
    // call - so a late pause from a finished call must not be reported.
    setTimeout(() => {
      if (isStale(myCall)) return;
      parentHandlePlayPause(false);
    }, 0);
  }

  const onAudioEnded = () => {
    console.log("[player] audio ended  call=" + (call ? call._id : "none"));
    if (props.onEnded) props.onEnded();
  }

  const onAudioError = () => {
    const el = audioElRef.current;
    console.error("[player] audio ERROR  call=" + (call ? call._id : "none") +
      "  code=" + (el && el.error ? el.error.code : "?"));
    // Move on rather than stalling. One call whose audio will not load used to
    // stop autoplay dead, because nothing ever reported that it had finished.
    // Treating a failure like an ending keeps the feed moving.
    if (props.onEnded) props.onEnded();
  }

  // Keeps the existing progress readout and source-id stepping working, driven
  // by the element rather than by WaveSurfer.
  const onAudioTimeUpdate = () => {
    const el = audioElRef.current;
    if (!el) return;
    const currentTime = el.currentTime;
    if (call && ((call.srcList.length - 1) >= (sourceIndex + 1)) && (currentTime > call.srcList[sourceIndex + 1].pos)) {
      setSourceIndex(sourceIndex + 1);
    }
    setPlayTime(Math.floor(currentTime));

    // Keeps the waveform cursor tracking real playback. WaveSurfer is no longer
    // the thing playing, so without this the waveform would sit still while the
    // audio ran.
    //
    // Mapped as a proportion rather than in seconds. The waveform is drawn from
    // WaveSurfer's own decode of the file, and if its idea of the duration
    // differs at all from the element's, an absolute seek puts the cursor in
    // the wrong place and the waveform reads as the wrong length. A fraction is
    // correct whatever the two durations are.
    if (wavesurfer && el.duration && isFinite(el.duration) && el.duration > 0) {
      try {
        wavesurfer.seekTo(Math.min(1, Math.max(0, currentTime / el.duration)));
      } catch (err) { /* waveform not decoded yet */ }
    }
  }

  // Clicking the waveform to scrub still works: WaveSurfer reports where the
  // click landed and the audio element seeks there.
  const onWaveformInteraction = (ws, newTime) => {
    const el = audioElRef.current;
    if (!el || typeof newTime !== "number" || !isFinite(newTime)) return;

    // newTime is in the waveform's own time domain, so convert through a
    // proportion rather than assuming the two durations agree - the same
    // reason the cursor is driven by fraction above.
    const waveDuration = ws && ws.getDuration ? ws.getDuration() : 0;
    let target = newTime;
    if (waveDuration > 0 && el.duration && isFinite(el.duration)) {
      target = (newTime / waveDuration) * el.duration;
    }

    el.currentTime = Math.min(el.duration || target, Math.max(0, target));
    if (el.paused) {
      el.play().catch(err => console.warn("[player] play rejected: " + err));
    }
  }

  // Handlers with an identity that never changes.
  //
  // @wavesurfer/react rebuilds its event-binding effect whenever a handler
  // identity changes, and every handler here is recreated on each render - the
  // parent recreates its callbacks too, so memoizing on dependencies does not
  // help. The bindings were observably ending up doubled: one instance (ws1)
  // emitting play and finish twice per call, which advanced the playlist twice
  // and tore the player down mid-fetch.
  //
  // Routing through a ref gives the wrapper a set of handlers that are stable
  // for the lifetime of the component, so it binds once per player, while the
  // functions those handlers call are still the current ones each render.
  const handlersRef = useRef({});

  const stableOnReady = useCallback((ws) => handlersRef.current.onReady(ws), []);
  const stableOnLoad = useCallback((ws) => handlersRef.current.onLoad(ws), []);
  const stableOnError = useCallback((ws, err) => handlersRef.current.onError(ws, err), []);
  const stableOnFinish = useCallback((ws) => handlersRef.current.onFinishLogged(ws), []);
  const stableOnPlay = useCallback((ws) => handlersRef.current.onPlay(ws), []);
  const stableOnPause = useCallback((ws) => handlersRef.current.onPause(ws), []);
  const stableOnAudioprocess = useCallback((ws) => handlersRef.current.updatePlayProgress(ws), []);
  const stableOnInteraction = useCallback((ws, newTime) => handlersRef.current.onWaveformInteraction(ws, newTime), []);

  const updatePlayProgress = () => {

    if (wavesurfer && wavesurfer.isPlaying()) {
      var totalTime = wavesurfer.getDuration(),
        currentTime = wavesurfer.getCurrentTime(),
        remainingTime = totalTime - currentTime;

      if (!isPlaying) {
        setIsPlaying(true);
      }
      //console.log("totalTime: " + totalTime + " currentTime: " + currentTime + " remainingTime: " + remainingTime);


      // this checks to see if it should display the next Source ID
      if (call && ((call.srcList.length - 1) >= (sourceIndex + 1)) && (currentTime > call.srcList[sourceIndex + 1].pos)) {
        setSourceIndex(sourceIndex + 1);
        console.log("sourceIndex: " + sourceIndex);
      }

      setPlayTime(Math.floor(currentTime));
    }
  }

  // Kept current every render, while the stable wrappers above keep the
  // identities the wrapper sees from ever changing.
  handlersRef.current = { onReady, onLoad, onError, onFinishLogged, onPlay, onPause, updatePlayProgress, onWaveformInteraction };

  // Bound once per instance. The stable wrappers never change identity, so this
  // does not rebind on every render.
  useEffect(() => {
    if (!wavesurfer) return;
    const subs = [
      wavesurfer.on("ready", () => stableOnReady(wavesurfer)),
      wavesurfer.on("interaction", (newTime) => stableOnInteraction(wavesurfer, newTime)),
      wavesurfer.on("error", (err) => stableOnError(wavesurfer, err)),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [wavesurfer, stableOnReady, stableOnInteraction, stableOnError]);

  let playEnabled = { "disabled": true }
  let sourceId = "-";

  if (call) {
    if (call.srcList.length > sourceIndex) {
      sourceId = call.srcList[sourceIndex].src;
    }
    playEnabled = {};
  }

  return (


    <div className="mediaplayer-container">

      <div className="icon-button-item desktop-only" >
        <Popup trigger={<Icon name='volume off' />} hoverable position='top center'>
          <Icon name='volume down' className="volume-icon" />
          <input
            className="volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={volume}
            onChange={event => {
              setVolume(event.target.valueAsNumber)
            }}
          />
          <Icon name='volume up' className="volume-icon" />
        </Popup>
      </div>

      <div className="icon-button-item" onClick={onPlayPause}>
        {
          isPlaying
            ? (<Icon name="pause" />)
            : (<Icon name="play" />)
        }
      </div>

      {/* The actual player. Keyed on the call so React swaps the src cleanly,
          and autoPlay so a newly selected call starts on its own. */}
      <audio
        key={call ? call._id : "none"}
        ref={audioElRef}
        src={call ? call.url : undefined}
        autoPlay
        preload="auto"
        style={{ display: "none" }}
        onPlay={onAudioPlay}
        onPause={onAudioPause}
        onEnded={onAudioEnded}
        onError={onAudioError}
        onTimeUpdate={onAudioTimeUpdate}
      />

      <div className="mediaplayer-item">

        {/* The waveform. WaveSurfer draws into this container, and each call
            is loaded into the single long-lived instance created above - so
            nothing is destroyed between calls and no fetch gets aborted.
            Clicking it seeks the audio element. */}
        <div ref={waveformContainerRef} className="waveform-container" />
      </div>

      <div className="label-item">
        <LabelGroup size="small" >
          <Label color="black">
            {playTime}
            Sec
          </Label>
          <Label color="black" className="desktop-only">
            {sourceId}
          </Label>
        </LabelGroup>

      </div>
    </div>
  )
  /*
    const audioRef = React.createRef();
    const [sourceIndex, setSourceIndex] = useState(0);
    const [playProgress, setPlayProgress] = useState(0);
    const [playTime, setPlayTime] = useState(0);
    const parentHandlePlayPause = props.onPlayPause
    const playSilence = props.playSilence;
  
    const handlePause = () => { setIsPlaying(false); }
    const handlePlay = () => { setIsPlaying(true); }
    const playPause = () => {
      const audio = audioRef.current.audioEl.current;
      if (isPlaying) {
        setIsPlaying(false);
        parentHandlePlayPause(false);
        audio.pause();
      } else {
        setIsPlaying(true);
        parentHandlePlayPause(true);
        audio.play();
      }
    }
  
    const call = props.call;
  
    useEffect(() => {
  
      const audio = audioRef.current.audioEl.current;
      const onEnded = props.onEnded;
      setSourceIndex(0);
      if (call ) {
        audio.src = call.url;
        const playPromise = audio.play();
  
        // In browsers that don’t yet support this functionality,
        // playPromise won’t be defined.
        if (playPromise !== undefined) {
          playPromise.then(function () {
  
          }).catch(function (error) {
            console.log("Automatic playback failed: " + error);
            handlePause();
            //onEnded();
            // Show a UI element to let the user manually start playback.
          });
        } else {
          audio.src = false;
        }
      }
    }, [call]);
  
    useEffect(() => {
      const audio = audioRef.current.audioEl.current;
  
      setSourceIndex(0);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Waiting for Call...",
          album: process.env.REACT_APP_SITE_NAME,
          artwork: [
            { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/android-chrome-192x192.png', sizes: '512x512', type: 'image/png' },
          ]
        });
      }
      audio.src = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
      const playPromise = audio.play();
  
      // In browsers that don’t yet support this functionality,
      // playPromise won’t be defined.
      if (playPromise !== undefined) {
        playPromise.then(function () {
  
        }).catch(function (error) {
          console.log("Automatic playback failed: " + error);
          // Show a UI element to let the user manually start playback.
        });
      } else {
        audio.src = false;
      }
  
    }, [playSilence]);
  
  
    const updatePlayProgress = () => {
      const audio = audioRef.current.audioEl.current;
      const { currentTime, duration } = audio;
  
  
      // this checks to see if it should display the next Source ID
      if (call && ((call.srcList.length - 1) >= (sourceIndex + 1)) && (currentTime > call.srcList[sourceIndex + 1].pos)) {
        setSourceIndex(sourceIndex + 1);
      }
  
      // updates the play percentage progress and current playing time
      setPlayProgress(currentTime / duration * 100);
      setPlayTime(Math.floor(currentTime));
  
  
    }
  
  
  
  
    let playEnabled = { "disabled": true }
    let sourceId = "-";
  
    if (call) {
      if (call.srcList.length > sourceIndex) {
        sourceId = call.srcList[sourceIndex].src;
      }
      playEnabled = {};
    }
    return (
      <Menu.Menu>
        <ReactAudioPlayer
          ref={audioRef}
          onPause={handlePause}
          onPlay={handlePlay}
          listenInterval={100}
          onListen={updatePlayProgress}
          onEnded={props.onEnded}
          autoPlay
        />
  
  
        <Menu.Item onClick={playPause}  >
  
          {
            isPlaying
              ? (<Icon name="pause" />)
              : (<Icon name="play" />)
          }
        </Menu.Item>
        <Menu.Item>
          <Progress inverted percent={playProgress} />
          <Label color="black">
            {playTime}
            Sec
          </Label>
          <Label color="black" className="desktop-only">
            {sourceId}
          </Label>
  
        </Menu.Item>
      </Menu.Menu>
    )*/
}

export default MediaPlayer;
