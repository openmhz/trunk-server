import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from 'react-router-dom';
import MediaPlayer from "./components/MediaPlayer";
import SupportModal from "../Common/SupportModal";
import CallInfo from "./components/CallInfo";
import ListCalls from "./components/ListCalls";
import { useSelector, useDispatch } from 'react-redux'
import { useGetTalkgroupsQuery } from '../features/api/apiSlice'
import { playedCall, failedCall } from "../features/calls/callsSlice";
import { setCurrentCallId } from "../features/callPlayer/callPlayerSlice";
import { nextAfterFailure, getNextPlayableId, isPlaybackStalled } from "./playback";
import { useInView } from 'react-intersection-observer';
import {
  Container,
  Rail,
  Sticky,
  Menu,
  Icon,
  Sidebar,
  Message,
  MessageHeader,
  Button,
  ButtonContent,
  Checkbox,
  GridColumn, Grid,
  GridRow,
  Form
} from "semantic-ui-react";
import "./CallPlayer.css";
import queryString from '../query-string';
import { useCallLink } from "./components/CallLinks";
import "./CallPlayer.css";


// ----------------------------------------------------
function CallPlayer(props) {

  const { shortName } = useParams();
  const system = props.system;
  const selectCallId = props.selectCallId;
  const callsData = props.callsData;
  const handleNewer = props.handleNewer;
  const handleOlder = props.handleOlder;
  const { ref: loadOlderRef, inView: loadOlderInView } = useInView({
    /* Optional options */
    threshold: 0.5
  });
  const { ref: loadNewerRef, inView: loadNewerInView } = useInView({
    /* Optional options */
    threshold: 0.5
  });

  const backgroundAutoplay = useSelector((state) => state.callPlayer.backgroundAutoplay);
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  const [statusVisible, setStatusVisible] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [silenceCount, setSilenceCount] = useState(0);
  const [needsTap, setNeedsTap] = useState(false); // autoplay was blocked by the browser
  const [selectedInitialCall, setSelectedInitialCall] = useState(false);
  const { callLink, callDownload, callTweet } = useCallLink(currentCall)

  const dispatch = useDispatch();
  const stickyRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const startedAtRef = useRef(0);       // when the current call was started
  const lastProgressRef = useRef(0);    // last time its audio advanced
  const attemptRef = useRef(0);         // increments for every call we start
  const failedAttemptRef = useRef(-1);  // attempt that was already reported as failed

  let currentCallId = false;

  if (currentCall) {
    currentCallId = currentCall._id;
  }

  // Start playing a call. Every path that changes the current call goes through here.
  const startCall = useCallback((call) => {
    attemptRef.current += 1;
    startedAtRef.current = Date.now();
    lastProgressRef.current = 0;
    setCurrentCall(call);
    dispatch(setCurrentCallId(call._id));
    dispatch(playedCall(call._id));
    setIsPlaying(true);
  }, [dispatch]);

  const playCall = useCallback((data) => {
    startCall(data.call);
  }, [startCall]);

  useEffect(() => () => {
    dispatch(setCurrentCallId(false));
  }, []);

  const handlePlayPause = (playing) => {
    setIsPlaying(playing);
    if (playing) {
      setNeedsTap(false);
      lastProgressRef.current = Date.now();
    }
  }

  const handleProgress = () => {
    lastProgressRef.current = Date.now();
  }

  const handleAutoPlay = (currentAutoPlay) => {
    setAutoPlay(!currentAutoPlay);
  }

  // The browser refused to start audio without a user gesture: don't pretend to be playing.
  const handleAutoplayBlocked = () => {
    setIsPlaying(false);
    setNeedsTap(true);
  }

  // Audio failed to load/decode/play, or stalled: mark it, then move on to the next call.
  const handleCallFailed = () => {
    if (!currentCallId) return;
    if (failedAttemptRef.current === attemptRef.current) return; // already handled
    failedAttemptRef.current = attemptRef.current;
    console.log("Call failed, skipping: " + currentCallId);
    dispatch(failedCall(currentCallId));
    setIsPlaying(false);
    if (callsData) {
      const nextId = nextAfterFailure({ autoPlay, ids: callsData.ids, entities: callsData.entities, failedId: currentCallId });
      if (nextId) startCall(callsData.entities[nextId]);
    }
  }

  // Watchdog: a call that is "playing" but makes no progress for its length + 10s has failed.
  const handleCallFailedRef = useRef(handleCallFailed);
  handleCallFailedRef.current = handleCallFailed;
  const currentLen = currentCall ? currentCall.len : 0;
  useEffect(() => {
    if (!isPlaying || !currentCallId) return;
    const timer = setInterval(() => {
      if (isPlaybackStalled({
        isPlaying: true,
        startedAt: startedAtRef.current,
        lastProgressAt: lastProgressRef.current,
        now: Date.now(),
        lengthSec: currentLen
      })) {
        handleCallFailedRef.current();
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [isPlaying, currentCallId, currentLen]);

  /* This function gets called whenever the currently playing call ends.*/

  const callEnded = () => {
    if (callsData) {
      if (autoPlay) {
        const nextId = getNextPlayableId(callsData.ids, callsData.entities, currentCallId);
        if (nextId) {
          console.log("Autoplaying next call: " + nextId);
          startCall(callsData.entities[nextId]);
        } else if (backgroundAutoplay) {
          // there are no more calls to play, but we want to keep playing something so the webpage is not put to sleep, so we play silence!
          // The silence is not counted as "playing", so a new live call is never held up by it.
          setIsPlaying(false);
          setSilenceCount(silenceCount + 1);
        } else {
          // there are no more calls to play and backgroundAutoplay is disabled
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    } else {
      console.log("Somehow called, callEnded() but callsData was false");
    }
  }

  useEffect(() => {
    if (loadNewerInView && callsData && (callsData.ids.length > 0)) {
      handleNewer();
    }
  }, [loadNewerInView]);


  useEffect(() => {
    if (loadOlderInView && callsData && (callsData.ids.length > 0)) {
      handleOlder();
    }
  }, [loadOlderInView]);

  // This handles when a Call is specified in the URI
  useEffect(() => {
    if (props.initialCallId && callsData) {
      const call = callsData.entities[props.initialCallId];
      if (call && !selectedInitialCall) {
        const time = new Date(call.time);

        console.log("Playing Initial Call: " + call._id + " Start Time: " + time.toLocaleTimeString());
        setSelectedInitialCall(true); // signals that it has selected the initial call - you only want to do this once
        startCall(call);
      }
    }
  }, [props.initialCallId, callsData])

  // Triggered when a new call is selected in the parent component.
  // This happens when a new call comes over the socket
  // When a call is set to CurrentCall, it will automatically start playing
  // we should only set the selectCallId to be the current call when AutoPlay is selected
  // and when there isn't another call already playing
  useEffect(() => {
    console.log("New selected call: " + selectCallId + " IsPlaying: " + isPlaying + " autoPlay: " + autoPlay);
    if (selectCallId && callsData && !isPlaying && autoPlay) {
      const call = callsData.entities[selectCallId];
      if (call) {
        const time = new Date(call.time);

        console.log("Playing Selected Call: " + call._id + " Start Time: " + time.toLocaleTimeString());
        startCall(call);
      }
    }
  }, [selectCallId])

  useEffect(() => {
    if (system && system.status && system.status.length > 0) {
      setStatusVisible(true);
    }
  }, [system])

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        const wakeLock = await navigator.wakeLock.request("screen");
      } catch (err) {
        // the wake lock request fails - usually system related, such being low on battery
        console.log(`${err.name}, ${err.message}`);
      }
    };
    
    requestWakeLock();
  }, []);

  const handleStatusDismiss = () => {
    setStatusVisible(false);
  }

  let autoplayClassName = "button-item";
  if (autoPlay) {
    autoplayClassName += " active";
  }
  return (
    <div ref={positionRef}>
      <Container className="main" >
        {statusVisible &&
          <Sticky offset={60} context={positionRef}>
            <Message floating onDismiss={handleStatusDismiss} warning> <MessageHeader>System Status</MessageHeader>{system.status}</Message>
          </Sticky>
        }
        <Sidebar.Pushable>
          <Sidebar.Pusher style={{ minHeight: '100vh' }} >
            <div ref={loadNewerRef} />
            <ListCalls callsData={callsData} activeCallId={currentCallId} talkgroups={talkgroupsData ? talkgroupsData.talkgroups : false} playCall={playCall} />
            <div ref={loadOlderRef} style={{ height: 50 }} />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
        <Rail position='right' className="desktop-only"  >
          <Sticky offset={60} context={positionRef}>
            <CallInfo call={currentCall} />
          </Sticky>
        </Rail>
      </Container>

      {needsTap &&
        <div style={{ position: 'fixed', bottom: '4.5em', left: 0, right: 0, textAlign: 'center', zIndex: 1000, pointerEvents: 'none' }}>
          <Message compact info style={{ display: 'inline-block', margin: 0 }}>
            <Icon name="play" /> Tap play to start listening
          </Message>
        </div>
      }
      <Menu fixed="bottom" inverted vertical fluid>
        <div className="item-container">
          <div className={autoplayClassName} onClick={() => handleAutoPlay(autoPlay)}><Icon name="level up" /><span className="desktop-only">Autoplay</span></div>
          <div className="mediaplayer">
            <MediaPlayer call={currentCall} playSilence={silenceCount} onEnded={callEnded} onPlayPause={handlePlayPause} onFailed={handleCallFailed} onAutoplayBlocked={handleAutoplayBlocked} onProgress={handleProgress} />
          </div>
          <div className="link-item desktop-only" >
            <a href={callDownload}><Icon name="download" />Download</a>
          </div>
          <div className="link-item desktop-only">
            <a href={callLink}><Icon name="at" />Link</a>
          </div>
        </div>
      </Menu>
    </div>
  );
}


export default CallPlayer;
