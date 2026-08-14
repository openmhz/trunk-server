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
import WavesurferPlayer from '@wavesurfer/react'
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
  const [wavesurfer, setWavesurfer] = useState(null)
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
  const regionsPlugin = useMemo(() => RegionsPlugin.create(), [callId]);
  const plugins = useMemo(() => [regionsPlugin], [regionsPlugin]);


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
    if (wavesurfer) {
      wavesurfer.setVolume(volume);
    }
  }, [volume, wavesurfer]);


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
    setWavesurfer(ws)
    setIsPlaying(false)
    // Drawing the source markers must never be able to stop the audio. If the
    // regions plugin throws - it is torn down with the player each time the
    // call changes - losing the markers is a far better outcome than losing
    // playback, which is what used to happen.
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
    console.log("[player] finish " + (ws && ws.__tag) + "  call=" + (call ? call._id : "none"));
    if (onEnded) onEnded(ws);
  }, [call, onEnded]);

  const onPlay = useCallback((ws) => {
    console.log("[player] play   " + (ws && ws.__tag) + "  call=" + (call ? call._id : "none"));
    setIsPlaying(true);
    parentHandlePlayPause(true);

  }, [call, parentHandlePlayPause]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
    parentHandlePlayPause(false);
  }, [parentHandlePlayPause]);
  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause()
  }

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

      <div className="mediaplayer-item">

        <WavesurferPlayer
          autoplay={true}
          height={25}
          barWidth={3}
          barGap={3}
          barRadius={6}
          waveColor="#E81B39"
          url={call.url}
          fetchParams={FETCH_PARAMS}
          onLoad={onLoad}
          onError={onError}
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          onAudioprocess={updatePlayProgress}
          onFinish={onFinishLogged}
          plugins={plugins}
        />
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
