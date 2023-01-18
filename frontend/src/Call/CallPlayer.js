import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';

import MediaPlayer from "./MediaPlayer";

import SupportModal from "./SupportModal";

import CallInfo from "./CallInfo";
import ListCalls from "./ListCalls";
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



const socket = io(process.env.REACT_APP_BACKEND_SERVER);


// ----------------------------------------------------
function CallPlayer(props) {

  const { shortName } = useParams();
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
  const callsData = props.callsData;

  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadCallId, setLoadCallId] = useState(false);

  const filterType = useSelector((state) => state.callPlayer.filterType);
  const filterGroupId = useSelector((state) => state.callPlayer.filterGroupId);
  const filterTalkgroups = useSelector((state) => state.callPlayer.filterTalkgroups);
  const filterStarred = useSelector((state) => state.callPlayer.filterStarred);
  const filterDate = useSelector((state) => state.callPlayer.filterDate);
  const live = useSelector((state) => state.callPlayer.live);


  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const pageYOffset = useRef(); // Store the current Scroll Offset in a way that guarantees the latest value is available when Call Data is updated
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
/*
  useEffect(() => {
    if ( loadCallId && callsData) {
      const call = callsData.entities[loadCallId];
      if (call) {
        setCurrentCall(call);
      }
    }
  }, [callsData])*/

  useLayoutEffect( () => {
    const scrollAmount = parseInt(positionRef.current.clientHeight) - parseInt(pageYOffset.current);
    if (scrollAmount > 0) {
      console.log("useLayoutEffect for callsData -  ref: " + pageYOffset.current + " current: " + positionRef.current.clientHeight + " Scroll Amount: " + scrollAmount)
      window.scrollBy(0, scrollAmount);
    }
  }, [callsData])

/*
  useEffect(() => {

  }, [callsData]);
*/


  var callInfoHeader = "Call Info";
  var callLink = ""
  var callDownload = ""
  if (currentCall) {
    if ((talkgroupsData) && talkgroupsData[currentCall.talkgroupNum]) {
      callInfoHeader = talkgroupsData[currentCall.talkgroupNum].description;
    }
    const callDate = new Date(currentCall.time);
    var search = ""
    switch (filterType) {

      case 1:
        search = `filter-type=group&filter-code=${filterGroupId}&`;
        break;
      case 2:
        search = `filter-type=talkgroup&filter-code=${filterTalkgroups}&`;
        break;
      default:
      case 0:
        break;

    }
    callLink = "/system/" + shortName + "?" + search + "call-id=" + currentCall._id + "&time=" + (callDate.getTime() + 1);
    callDownload = currentCall.url;
  }



  return (
    <div ref={positionRef}>
      <Container className="main">
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
            <CallInfo call={currentCall} header={callInfoHeader} link={callLink} />
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
