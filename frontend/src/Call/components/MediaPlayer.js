import React, { useEffect, useState, useMemo, useRef } from "react";
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


import "./MediaPlayer.css";




const SILENCE_URL = "/silence.m4a";

const MediaPlayer = (props) => {
  const call = props.call;
  const [volume, setVolume] = useState(1);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [wavesurfer, setWavesurfer] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTime, setPlayTime] = useState(0);
  const playSilence = props.playSilence;
  const parentHandlePlayPause = props.onPlayPause
  // The silence clip keeps the page/audio session alive. It is never reported to the
  // parent as "playing", so it can't hold up a new live call.
  const silenceRef = useRef(false);
  const callIdRef = useRef(false);
  const currentCallKey = call ? call._id : false;
  callIdRef.current = currentCallKey;
  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);
  const plugins = useMemo(() => [regionsPlugin], [regionsPlugin]);


  useEffect(() => {
    setSourceIndex(0);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Waiting for Call...",
        album: 'OpenMHz',
        artwork: [
          { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }

    if (playSilence > 0 && wavesurfer) {
      silenceRef.current = true;
      regionsPlugin.clearRegions();
      Promise.resolve(wavesurfer.load(SILENCE_URL)).catch(() => {});
    }
  }, [playSilence]);

  // a real call replaces whatever silence was playing
  useEffect(() => {
    silenceRef.current = false;
  }, [currentCallKey]);

  useEffect(() => {
    setSourceIndex(0);
  }, [call]);

  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.setVolume(volume);
    }
  }, [volume, wavesurfer]);


  const reportFailure = (err) => {
    if (silenceRef.current) return; // the silence clip is allowed to fail quietly
    if (err && err.name === 'AbortError') return; // a newer load replaced this one
    console.log("Playback error: " + (err && err.message ? err.message : err));
    setIsPlaying(false);
    props.onFailed && props.onFailed(err);
  }

  const onReady = (ws) => {
    setWavesurfer(ws)
    setIsPlaying(false)
    regionsPlugin.clearRegions();
    if (silenceRef.current) {
      Promise.resolve(ws.play()).catch(() => {});
      return;
    }
    // Start the call ourselves so a rejected play() (autoplay blocked, bad media) is visible.
    // The media element's own 'error' event is forwarded by wavesurfer as its 'error' event.
    const forCallId = callIdRef.current;
    try {
      const played = ws.play();
      if (played && played.catch) {
        played.catch((err) => {
          if (callIdRef.current !== forCallId) return; // stale: another call is loaded now
          if (err && err.name === 'AbortError') return;
          if (err && err.name === 'NotAllowedError') {
            setIsPlaying(false);
            props.onAutoplayBlocked && props.onAutoplayBlocked();
          } else {
            reportFailure(err);
          }
        });
      }
    } catch (err) {
      reportFailure(err);
    }
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
    if (silenceRef.current) return; // silence doesn't count as playing
    setIsPlaying(true);
    parentHandlePlayPause(true);

  }

  const onPause = () => {
    if (silenceRef.current) return;
    setIsPlaying(false);
    parentHandlePlayPause(false);
  }
  const onPlayPause = () => {
    if (!wavesurfer) return;
    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
    } else {
      // a user tap is the gesture the browser wants; swallow aborts from a racing load
      Promise.resolve(wavesurfer.play()).catch(() => {});
    }
  }

  const updatePlayProgress = () => {

    if (wavesurfer && wavesurfer.isPlaying()) {
      var totalTime = wavesurfer.getDuration(),
        currentTime = wavesurfer.getCurrentTime(),
        remainingTime = totalTime - currentTime;

      if (silenceRef.current) return;
      props.onProgress && props.onProgress();
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
  let sourceTag = "";

  if (call) {
    if (call.srcList.length > sourceIndex) {
      sourceId = call.srcList[sourceIndex].src;
      if (call.srcList[sourceIndex].tag !== undefined && call.srcList[sourceIndex].tag !== null && call.srcList[sourceIndex].tag !== "") {
        sourceTag = call.srcList[sourceIndex].tag;
      }
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
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          onAudioprocess={updatePlayProgress}
          onFinish={props.onEnded}
          onError={(ws, err) => reportFailure(err)}
          plugins={plugins}
        />
      </div>

      <div className="label-item">
        <LabelGroup size="small" >
          <Label color="black">
            {playTime}
            Sec
          </Label>
          <Label color="black" className="desktop-only tag-label">
            {sourceTag!== "" ? sourceTag : sourceId}
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
          album: 'OpenMHz',
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
