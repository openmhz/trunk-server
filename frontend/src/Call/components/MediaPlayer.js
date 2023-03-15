import React, { useEffect, useState } from "react";
import {
  Menu,
  Icon,
  Progress,
  Label
} from "semantic-ui-react";
import ReactAudioPlayer from 'react-audio-player'



const MediaPlayer = (props) => {

  const audioRef = React.createRef();
  const [sourceIndex, setSourceIndex] = useState(0);
  const [playProgress, setPlayProgress] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const parentHandlePlayPause = props.onPlayPause
  const playSilence = props.playSilence;

  const handlePause = () => { setIsPlaying(false);  }
  const handlePlay = () => { setIsPlaying(true);  }
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
    if (call) {
      audio.src = call.url;
      const playPromise = audio.play();

      // In browsers that don’t yet support this functionality,
      // playPromise won’t be defined.
      if (playPromise !== undefined) {
        playPromise.then(function () {

        }).catch(function (error) {
          console.log("Automatic playback failed: " + error);
          handlePause();
          onEnded();
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
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Waiting for Call...",
      album: 'OpenMHz',
      artwork: [
        { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-192x192.png', sizes: '512x512', type: 'image/png' },
      ]
    });
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
      sourceId = call.srcList[sourceIndex].src + " " + call.srcList[sourceIndex].tag;
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
  )
}

export default MediaPlayer;
