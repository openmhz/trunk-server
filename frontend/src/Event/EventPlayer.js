import React, { useEffect, useState, useRef } from "react";
import {  useNavigate } from 'react-router-dom';
import MediaPlayer from "../Call/components/MediaPlayer";

import SupportModal from "../Common/SupportModal";
import EventCallInfo from "./EventCallInfo";
import ListEventCalls from "./ListEventCalls";
import { useDispatch } from 'react-redux'

import {
  Container,
  Rail,
  Sticky,
  Menu,
  Icon,
  Sidebar,
  Button,
  ButtonContent
} from "semantic-ui-react";


import { useCallLink } from "../Call/components/CallLinks";
import "../Call/CallPlayer.css";



// ----------------------------------------------------
function EventPlayer(props) {


  const eventData = props.eventData;
  const selectCallId = props.selectCallId;


  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);


  const { callLink, callDownload, callTweet } = useCallLink(currentCall)

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const shouldPlayAddCallRef = useRef(); // we need to do this to make the current value of isPlaying available in the socket message callback
  shouldPlayAddCallRef.current = (!isPlaying && autoPlay) ? true : false;

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
    //data.call.played = true;
    setCurrentCall(data.call);

    setIsPlaying(true);
  }


  const callEnded = () => {
    if (eventData) {
      const currentIndex = eventData.calls.findIndex(call => call._id === currentCallId);
      if (autoPlay && (currentIndex > 0)) {

        const nextCall = eventData.calls[currentIndex - 1];
        //eventData.calls[currentIndex].played = true;
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
    if (selectCallId && eventData && !currentCall) {
      const call = eventData.calls.find((call) => call._id == selectCallId);
      if (call) {
        setCurrentCall(call);
      }
    }
  }, [selectCallId, eventData])

  let autoplayClassName = "button-item";
  if (autoPlay) {
    autoplayClassName += " active";
  }
  return (
    <div ref={positionRef}>
      <Container className="main" >
        <Sidebar.Pushable>
          <Sidebar.Pusher
            style={{ minHeight: '100vh' }}
          >
            <ListEventCalls eventData={eventData} activeCallId={isPlaying ? currentCallId : false} playCall={playCall} />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
        <Rail position='right' className="desktop-only"  >
          <Sticky offset={60} context={positionRef}>
            <EventCallInfo call={currentCall} />
          </Sticky>
        </Rail>
      </Container>


      <Menu fixed="bottom" inverted vertical fluid>
        <div className="item-container">
          <div className={autoplayClassName}  onClick={() => handleAutoPlay(autoPlay)}><Icon name="level up" /><span className="desktop-only">Autoplay</span></div>
          <div className="mediaplayer">
            <MediaPlayer call={currentCall} onEnded={callEnded} onPlayPause={handlePlayPause} />
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


export default EventPlayer;
