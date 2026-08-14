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
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';


import { is } from "date-fns/locale";
import "./MediaPlayer.css";

// WaveSurfer downloads the audio itself, and audio now sits behind a gated
// endpoint on the api subdomain - a different origin - so the request needs the
// session cookie or it comes back 401.
//
// Declared out here, never inline. @wavesurfer/react decides when to rebuild
// the player by comparing the identity of every option it is given, so a fresh
// object each render rebuilds it continuously. That is the same reason `plugins`
// below is memoized.
const FETCH_PARAMS = { credentials: "include" };






const MediaPlayer = (props) => {
  const audioRef = React.createRef();
  const call = props.call;
  const [volume, setVolume] = useState(1);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [wavesurfer, setWavesurfer] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTime, setPlayTime] = useState(0);
  const playSilence = props.playSilence;
  const parentHandlePlayPause = props.onPlayPause
  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);
  const plugins = useMemo(() => [regionsPlugin], [regionsPlugin]);

  // Which call is current, readable from a handler that closed over an older
  // one - see the deferred notification in onPause.
  const currentCallIdRef = useRef(null);
  currentCallIdRef.current = call ? call._id : null;

  // Playback lives on its own audio element, separate from the waveform.
  //
  // WaveSurfer downloads the audio itself in order to draw, and anything that
  // rebuilds the player cancels that download. On a busy feed that happens
  // constantly - an incoming socket call re-renders this component while a
  // fetch is still running - and when playback rode on that same fetch, the
  // call simply went silent. A static bucket file always finished downloading
  // before anything could interrupt it, which is why this only began after the
  // audio was gated.
  //
  // The element owns loading and playing; WaveSurfer only draws. A cancelled
  // waveform fetch now costs a picture, never the audio.
  const audioElRef = useRef(null);

  // The waveform, built directly on wavesurfer.js rather than through
  // @wavesurfer/react.
  //
  // The wrapper decides for itself when to rebuild the player, from the
  // identity of everything passed to it, and it rebuilt during the commit that
  // switches calls - cancelling the download it needed in order to draw. There
  // is no way to prevent that from outside the wrapper, which is why no call
  // after the first ever drew.
  //
  // Owning the instance here means the effect below depends on exactly one
  // thing: the audio url. Nothing else in this component can trigger a rebuild,
  // so the download is never interrupted.
  const waveContainerRef = useRef(null);
  const wsRef = useRef(null);
  const waveUrl = call ? call.url : null;

  useEffect(() => {
    const container = waveContainerRef.current;
    if (!container || !waveUrl) return;

    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container,
      height: 25,
      barWidth: 3,
      barGap: 3,
      barRadius: 6,
      waveColor: "#E81B39",
      // Display only. The audio element makes the sound, so this stays silent.
      autoplay: false,
      fetchParams: FETCH_PARAMS,
      plugins: [regions],
    });
    wsRef.current = ws;
    ws.setVolume(0);

    ws.on("ready", () => {
      console.log("[wf] ready   call=" + (call ? call._id : "none") + "  duration=" + ws.getDuration().toFixed(2));
      // Markers must never be able to break the waveform.
      try {
        regions.clearRegions();
        (call && call.srcList ? call.srcList : []).forEach((src) => {
          regions.addRegion({
            start: src.pos,
            color: "rgba(128, 128, 128, 1.0)",
            drag: false,
            resize: false,
          });
        });
      } catch (err) {
        console.warn("[wf] markers failed: " + err);
      }
    });

    // Clicking the waveform seeks the audio element, so scrubbing controls
    // real playback.
    ws.on("interaction", (newTime) => onWaveformInteraction(ws, newTime));
    ws.on("error", (err) => console.warn("[wf] " + err));

    const loading = ws.load(waveUrl);
    if (loading && typeof loading.catch === "function") {
      loading.catch(() => { /* superseded or torn down */ });
    }

    return () => {
      wsRef.current = null;
      try { ws.destroy(); } catch (err) { /* already gone */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveUrl]);


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

    // The waveform is rebuilt per call by its own effect; nothing to do here.

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
    // Volume belongs to the audio element; the waveform stays silent.
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
    }
  }, [volume]);


  const onReady = (ws) => {
    console.log("[wf] ready   call=" + (call ? call._id : "none") + "  duration=" + (ws && ws.getDuration ? ws.getDuration().toFixed(2) : "?"));
    setWavesurfer(ws)
    setIsPlaying(false)
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
  }

  const onPlay = () => {
    setIsPlaying(true);
    parentHandlePlayPause(true);

  }

  const onPause = () => {
    setIsPlaying(false);

    // Deferred by a task, and this is the whole reason the second call would
    // not play.
    //
    // A WaveSurfer instance emits pause as it is destroyed, so this runs inside
    // that teardown - which happens during the commit that is building the
    // player for the next call. Setting parent state synchronously here forces
    // React to re-render mid-commit, the create effect runs a second time, and
    // the player that was already fetching the next call is destroyed with its
    // download in flight: "AbortError: signal is aborted without reason".
    //
    // This never showed before the audio was gated because a static bucket file
    // finished downloading before there was anything to interrupt.
    //
    // The call id is captured so a pause from a call that has already been
    // replaced cannot report "nothing is playing" over the call that now is.
    const pausedCall = call ? call._id : null;
    setTimeout(() => {
      const currentCall = currentCallIdRef.current;
      if (pausedCall !== currentCall) return;
      parentHandlePlayPause(false);
    }, 0);
  }
  const onPlayPause = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(err => console.warn("[wf] play rejected: " + err));
    } else {
      el.pause();
    }
  }

  // --- the audio element drives everything you hear ------------------------
  const onAudioPlay = () => {
    setIsPlaying(true);
    setTimeout(() => parentHandlePlayPause(true), 0);
  }

  const onAudioPause = () => {
    const pausedCall = call ? call._id : null;
    setIsPlaying(false);
    setTimeout(() => {
      if (pausedCall !== currentCallIdRef.current) return;
      parentHandlePlayPause(false);
    }, 0);
  }

  const onAudioEnded = () => {
    if (props.onEnded) props.onEnded();
  }

  const onAudioError = () => {
    const el = audioElRef.current;
    console.error("[wf] audio ERROR call=" + (call ? call._id : "none") +
      " code=" + (el && el.error ? el.error.code : "?"));
    // Keep the queue moving rather than stalling on one unplayable call.
    if (props.onEnded) props.onEnded();
  }

  const onAudioTimeUpdate = () => {
    const el = audioElRef.current;
    if (!el) return;
    const currentTime = el.currentTime;

    if (call && ((call.srcList.length - 1) >= (sourceIndex + 1)) && (currentTime > call.srcList[sourceIndex + 1].pos)) {
      setSourceIndex(sourceIndex + 1);
    }
    setPlayTime(Math.floor(currentTime));

    // Move the waveform cursor with real playback. As a proportion, so it stays
    // correct even if WaveSurfer decoded a slightly different duration.
    if (wsRef.current && el.duration && isFinite(el.duration) && el.duration > 0) {
      try {
        wsRef.current.seekTo(Math.min(1, Math.max(0, currentTime / el.duration)));
      } catch (err) { /* waveform not drawn yet */ }
    }
  }

  // Clicking the waveform seeks the audio, so scrubbing still works.
  const onWaveformInteraction = (ws, newTime) => {
    const el = audioElRef.current;
    if (!el || typeof newTime !== "number" || !isFinite(newTime)) return;
    const waveDuration = ws && ws.getDuration ? ws.getDuration() : 0;
    let target = newTime;
    if (waveDuration > 0 && el.duration && isFinite(el.duration)) {
      target = (newTime / waveDuration) * el.duration;
    }
    el.currentTime = Math.min(el.duration || target, Math.max(0, target));
    if (el.paused) {
      el.play().catch(err => console.warn("[wf] play rejected: " + err));
    }
  }

  const onWaveformError = (ws, err) => {
    console.warn("[wf] waveform fetch cancelled call=" + (call ? call._id : "none"));
  }

  // Stable identities that dispatch through a ref, so the memoized Waveform
  // above never re-renders on account of a handler while still calling current
  // code. Without this, comparing on url alone would freeze the handlers at
  // their first-render values.
  const wfHandlersRef = useRef({});
  wfHandlersRef.current = { onReady, onWaveformError, onWaveformInteraction };

  const stableWfReady = useCallback((ws) => wfHandlersRef.current.onReady(ws), []);
  const stableWfError = useCallback((ws, err) => wfHandlersRef.current.onWaveformError(ws, err), []);
  const stableWfInteraction = useCallback((ws, t) => wfHandlersRef.current.onWaveformInteraction(ws, t), []);

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

      {/* What you actually hear. Keyed per call so React swaps the source
          cleanly, and autoPlay so a newly selected call starts on its own. */}
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

        <div ref={waveContainerRef} className="waveform-container" />
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
