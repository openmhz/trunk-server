import React, { useEffect, useState } from "react";
import {
  Menu,
  Icon,
  Progress,
  Label
} from "semantic-ui-react";
import ReactAudioPlayer from 'react-audio-player'
import WavesurferPlayer from '@wavesurfer/react'
import { is } from "date-fns/locale";




const MediaPlayer = (props) => {

  const call = props.call;
  const [sourceIndex, setSourceIndex] = useState(0);
  const [wavesurfer, setWavesurfer] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTime, setPlayTime] = useState(0);
  const playSilence = props.playSilence;


  const onReady = (ws) => {
    setWavesurfer(ws)
    setIsPlaying(false)
  }

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause()
  }

  useEffect(() => {
    //const audio = audioRef.current.audioEl.current;

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
    if (wavesurfer) {
      var reader = new FileReader();
            
      reader.onload = function (evt) {
          // Create a Blob providing as first argument a typed array with the file buffer
          var blob = new window.Blob([new Uint8Array(evt.target.result)]);

          // Load the blob into Wavesurfer
          wavesurfer.loadBlob(blob);
      };

      reader.onerror = function (evt) {
          console.error("An error ocurred reading the file: ", evt);
      };

      // Read File as an ArrayBuffer
      reader.readAsArrayBuffer("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
    
  }
    /*const playPromise = audio.play();

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
    }*/

  }, [playSilence]);



  /*
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
    }, [call]);*/



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


    <Menu.Menu>
      <Menu.Item onClick={onPlayPause}  >

        {
          isPlaying
            ? (<Icon name="pause" />)
            : (<Icon name="play" />)
        }
      </Menu.Item>
      <Menu.Item>
        <WavesurferPlayer
          autoplay={true}
          height={25}
          width={300}
          waveColor="#E81B39"
          url={call.url}
          onReady={onReady}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onAudioprocess={updatePlayProgress}
          onFinish={props.onEnded}
          
        />
      </Menu.Item>
      <Menu.Item>
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
