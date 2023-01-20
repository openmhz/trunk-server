import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';

import MediaPlayer from "./components/MediaPlayer";

import SupportModal from "./components/SupportModal";

import CallInfo from "./components/CallInfo";
import ListCalls from "./components/ListCalls";
import { useSelector, useDispatch } from 'react-redux'
import { setLive, setFilter,setDateFilter } from "../features/callPlayer/callPlayerSlice";
import { getCalls, getOlderCalls, getNewerCalls, addCall } from "../features/calls/callsSlice";
import { useGetGroupsQuery, useGetTalkgroupsQuery } from '../features/api/apiSlice'
import { useInView } from 'react-intersection-observer';
import {
  Container,
  Label,
  Rail,
  Sticky,
  Menu,
  Icon,
  Sidebar
} from "semantic-ui-react";
import "./CallPlayer.css";
import queryString from '../query-string';
import io from 'socket.io-client';
import { useCallLink } from "./components/CallLinks";
import "./CallPlayer.css";


const socket = io(process.env.REACT_APP_BACKEND_SERVER);


// ----------------------------------------------------
function CallPlayer(props) {

  const { shortName } = useParams();
  const selectCallId = props.selectCallId;
  const callsData = props.callsData;

  const { ref: loadOlderRef, inView: loadOlderInView } = useInView({
    /* Optional options */
    threshold: 0.5
  });
  const { ref: loadNewerRef, inView: loadNewerInView } = useInView({
    /* Optional options */
    threshold: 0.5
  });

  const { data: groupsData, isSuccess: isGroupsSuccess } = useGetGroupsQuery(shortName);
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);


  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);


  const {callLink,callDownload,callTweet} = useCallLink(currentCall)




  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const shouldPlayAddCallRef = useRef(); // we need to do this to make the current value of isPlaying available in the socket message callback
  shouldPlayAddCallRef.current = (!isPlaying && autoPlay)?true:false;


  let currentCallId = false;


  if (currentCall) {
    currentCallId = currentCall._id;
  }

  const handlePlayPause = (playing) => {
    setIsPlaying(playing);
  }


  const handleAutoPlay = (currentAutoPlay) => {
    setAutoPlay(!currentAutoPlay);
  }

  const playCall = (data) => {
    setCurrentCall(data.call);
    setIsPlaying(true);
  }


  const callEnded = () => {
    if (callsData) {
      const currentIndex = callsData.ids.findIndex(callId => callId === currentCallId);
      if (autoPlay && (currentIndex > 0)) {
        const nextCallId = callsData.ids[currentIndex - 1];
        const nextCall = callsData.entities[nextCallId];

        setCurrentCall(nextCall);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } else {
      console.log("Somehow called, callEnded() but callsData was false");
    }
  }

  useEffect(() => {
    if (loadNewerInView && callsData && (callsData.ids.length > 0)) {
      dispatch(getNewerCalls({}));
    }
  }, [loadNewerInView]);


  useEffect(() => {
    if (loadOlderInView && callsData && (callsData.ids.length > 0)) {
      dispatch(getOlderCalls({}));
    }
  }, [loadOlderInView]);


  // Triggered when a new call is selected in the parent component.
  // This happens in 2 scenarios: when a call is specified in the URI or when a new call comes over the socket
  // When a call is set to CurrentCall, it will automatically start playing
  // we should only set the selectCallId to be the current call when AutoPlay is selected
  // and when there isn't another call already playing
  useEffect(() => {
    if ( selectCallId && callsData && !isPlaying && autoPlay) {
      const call = callsData.entities[selectCallId];
      if (call) {
        setCurrentCall(call);
      }
    }
  }, [selectCallId, callsData])




  return (
    <div ref={positionRef}>
      <Container className="main" >
        <Sidebar.Pushable>
          <Sidebar.Pusher
            style={{ minHeight: '100vh' }}
          >
            <div ref={loadNewerRef} />
            <ListCalls callsData={callsData} activeCallId={isPlaying?currentCallId:false} talkgroups={talkgroupsData?talkgroupsData.talkgroups:false} playCall={playCall} />
            <div ref={loadOlderRef} style={{ height: 50 }} />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
        <Rail position='right' className="desktop-only"  >
          <Sticky offset={60} context={positionRef}>
            <CallInfo call={currentCall} />
          </Sticky>
        </Rail>
      </Container>

      <Menu fixed="bottom" compact inverted >
        <Menu.Item active={autoPlay} onClick={() => handleAutoPlay(autoPlay)}><Icon name="level up" /><span className="desktop-only">Autoplay</span></Menu.Item>
        <MediaPlayer call={currentCall} onEnded={callEnded} onPlayPause={handlePlayPause} />
        <Menu.Menu position="right" className="desktop-only">
          <Menu.Item><SupportModal /></Menu.Item>
          <Menu.Item><a href={callDownload}><Icon name="download" />Download</a></Menu.Item>
          <Menu.Item><a href={callLink}><Icon name="at" />Link</a></Menu.Item>
        </Menu.Menu>
      </Menu>

    </div>
  );
}


export default CallPlayer;
