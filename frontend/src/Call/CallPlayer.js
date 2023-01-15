import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';

import MediaPlayer from "./MediaPlayer";
import FilterModal from "./FilterModal";
import GroupModal from "./GroupModal";
import SupportModal from "./SupportModal";
import CalendarModal from "./CalendarModalContainer";
import CallInfo from "./CallInfo";
import ListCalls from "./ListCalls";
import { useSelector, useDispatch } from 'react-redux'
import { setLive, setShortName, setFilter } from "../features/callPlayer/callPlayerSlice";
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
  Sidebar,
  Button
} from "semantic-ui-react";
import "./CallPlayer.css";
import queryString from '../query-string';
import io from 'socket.io-client';
import { setDateFilter } from "./call-actions";


const socket = io(process.env.REACT_APP_BACKEND_SERVER);


// ----------------------------------------------------
function CallPlayer(props) {

  const { shortName } = useParams();
  const { ref: loadOlderRef, inView: loadOlderInView, entry: loadOlderEntry } = useInView({
    /* Optional options */
    threshold: 0.5
  });
  const { ref: loadNewerRef, inView: loadNewerInView, entry: loadNewerEntry } = useInView({
    /* Optional options */
    threshold: 0.5
  });
  const { data: groupsData, isSuccess: isGroupsSuccess } = useGetGroupsQuery(shortName);
  //const { data:callsData, isSuccess:isCallsSuccess } = useGetCallsQuery({shortName});
  const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);

  //console.log(callsData);
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  //const allCalls  = callsData?callsData.ids.map( id => callsData.entities[id] ):[]

  const [autoPlay, setAutoPlay] = useState(true);
  const [addCallScroll, setAddCallScroll] = useState(false);
  const [currentCall, setCurrentCall] = useState(false);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [selectLoadCall, setSelectLoadCall] = useState(false);
  const [urlOptions, setUrlOptions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [groupVisible, setGroupVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [loadCallId, setLoadCallId] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef();
  const shouldPlayAddCallRef = useRef(); // we need to do this to make the current value of isPlaying available in the socket message callback
  shouldPlayAddCallRef.current = (!isPlaying && autoPlay)?true:false;

  const filterType = useSelector((state) => state.callPlayer.filterType);
  const filterGroupId = useSelector((state) => state.callPlayer.filterGroupId);
  const filterTalkgroups = useSelector((state) => state.callPlayer.filterTalkgroups);
  const filterStarred = useSelector((state) => state.callPlayer.filterStarred);
  const filterDate = useSelector((state) => state.callPlayer.filterDate);
  const live = useSelector((state) => state.callPlayer.live);
  const uri = queryString.parse(useLocation().search);
  const pathname = useLocation().pathname;

  let currentCallId = false;
  let currentCallMedia = false;

  if (currentCall) {
    currentCallId = currentCall._id;
    currentCallMedia = currentCall.url;
  }




  const handlePlayPause = (playing) => {
    setIsPlaying(playing);
  }

  const handlePusherClick = () => {
    if (sidebarOpened) setSidebarOpened(false);
  }


  const handleSidebarToggle = () => setSidebarOpened(!sidebarOpened);
  const handleFilterToggle = () => setFilterVisible(!filterVisible);
  const handleCalendarToggle = () => setCalendarVisible(!calendarVisible);

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

  const getFilterDescription = () => {

    var filter = { type: 'all', code: "", filterStarred: false };

    switch (filterType) {
      case 1:
        filter.type = "group";
        filter.code = filterGroupId
        break;
      case 2:
        filter.type = "talkgroup";
        filter.code = filterTalkgroups
        break;
      default:
      case 0:
        filter.type = "all";
        filter.code = ""
    }
    filter.filterStarred = filterStarred
    return filter;
  }


  const handleSocketMessage = (data) => {
    const message = JSON.parse(data)
    switch (message.type) {
      case 'calls':
        const ref = positionRef.current;
        setPrevScrollHeight(positionRef.current.clientHeight);
        setAddCallScroll(true);

        if (shouldPlayAddCallRef.current) {
          setCurrentCall(message);
        }

        dispatch(addCall(message));
        console.log("Got: " + message);
        break
      default:
        break
    }
  }

  const startSocket = () => {
    const filter = getFilterDescription();

    socket.emit("start", {
      filterCode: filter.code,
      filterType: filter.type,
      filterName: "OpenMHz",
      filterStarred: filter.starred,
      shortName: shortName
    });
  }
  const stopSocket = () => {
    socket.emit("stop");
  }

  const updateUri = () => {
    var search = "?"
    switch (filterType) {

      case 1:
        search = search + `filter-type=group&filter-code=${filterGroupId}`;
        break;
      case 2:
        search = search + `filter-type=talkgroup&filter-code=${filterTalkgroups}`;
        break;
      default:
      case 0:
        break;

    }
    if (loadCallId) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `call-id=${loadCallId}`
    }
    if (filterDate) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `time=${filterDate}`;
    }

    if (filterStarred) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `starred=true`;
    }
    navigate(pathname + search, { replace: true });

  }

  const handleLiveToggle = () => {
    if (!live) {
      dispatch(setDateFilter(false));
      dispatch(setLive(true));
      setCurrentCall(false);
      dispatch(getCalls({}));

      this.startSocket();
    }
  }

  const handleCalendarClose = (didUpdate) => {
    setCalendarVisible(!calendarVisible);

    if (didUpdate) {
      dispatchEvent(setLive(false));
      setCurrentCall(false);
      stopSocket();
      //this.socket.close();
    }
  }

  const handleGroupClose = (didUpdate) => {
    setGroupVisible(!groupVisible);
  }

  const handleFilterClose = (didUpdate) => {
    setFilterVisible(!filterVisible);

    if (didUpdate) {
      setCurrentCall(false);
    }
  }


  const setStateFromUri = async () => {
    var filter = {
      filterDate: false,
      filterType: 0,  // this is "all"
      filterTalkgroups: [],
      filterGroupId: false,
      filterStarred: false,
      live: true,
      shortName: shortName
    };

    // is there a star filter?
    if (uri.hasOwnProperty('starred')) {
      const starred = uri['starred'];
      filter.filterStarred = starred === 'true' ? true : false;
      if (!urlOptions) setUrlOptions(true);
    }

    // is there a time based filter?
    if (uri.hasOwnProperty('time')) {
      const date = new Date(parseInt(uri['time']));
      filter.filterDate = date.getTime();
      filter.live = false;
      if (!urlOptions) setUrlOptions(true);
    }

    // is this just for one call?
    if (uri.hasOwnProperty('call-id')) {
      const _id = uri['call-id'];
      const date = new Date(parseInt(uri['time']));
      setLoadCallId(_id);
      setSelectLoadCall(true);
      setAutoPlay(false);
      if (!urlOptions) setUrlOptions(true);
      //callActions.fetchCallInfo(_id);
      //callActions.setCallTime(date);
    }


    var filterType = "all";
    var filterCode = "";

    // is there a Filter set?
    if ((uri.hasOwnProperty('filter-code')) && (uri.hasOwnProperty('filter-type'))) {
      if (!urlOptions) setUrlOptions(true);

      // The Filter is a group
      if (uri['filter-type'] === "group") {
        filter.filterType = 1;
        filter.filterGroupId = uri["filter-code"];
        filterType = "group";
        filterCode = uri["filter-code"];
      }

      // The Filter is talkgroups
      if (uri['filter-type'] === 'talkgroup') {
        const tg = uri["filter-code"].split(',').map(Number);
        filter.filterType = 2;
        filter.filterTalkgroups = tg;
        filterType = "talkgroup";
        filterCode = tg;
      }
    }

    dispatch(setFilter(filter));
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

  useEffect(() => {
    if (addCallScroll) {
      const ref = positionRef.current;
      window.scrollBy(0, positionRef.current.clientHeight - prevScrollHeight);
      setAddCallScroll(false);
    }
    if (selectLoadCall && loadCallId && callsData) {

      const call = callsData.entities[loadCallId];
      if (call) {
        setSelectLoadCall(false);
        setCurrentCall(call);
      }
    }
  }, [callsData])

  useEffect(() => {
    setStateFromUri();
    return () => {
      stopSocket();
    };
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('reconnect', (attempts) => {
      console.log("Socket Reconnected after attempts: " + attempts); // true

      if (live) {
        this.startSocket();
      }
    })

    socket.on("new message", handleSocketMessage );

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, []);

  useEffect(() => {
    dispatch(getCalls({}));
    if (live) {
      startSocket();
    }
  }, [shortName, filterGroupId, filterTalkgroups, filterType, filterDate, filterStarred])


  // Update the Browser URI when any relevant values change
  useEffect(() => {
    updateUri();
  }, [filterGroupId, filterTalkgroups, filterType, filterDate, filterStarred, loadCallId])


  useEffect(() => {
    if (!urlOptions && groupsData && (groupsData.length > 0)) {
      setGroupVisible(true);
    }
  }, [groupsData])



  var archiveLabel = "";
  if (filterDate) {
    const filterDateObj = new Date(filterDate);
    archiveLabel = filterDateObj.toLocaleDateString() + " " + filterDateObj.toLocaleTimeString()
  }

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

  const archive = process.env.REACT_APP_ARCHIVE_DAYS

  var filterLabel = "All"
  switch (filterType) {
    case 1:
      filterLabel = "Group"
      break;

    case 2:
      filterLabel = "Talkgroups"
      break;
    default:
    case 0:
      filterLabel = "All"
  }

  return (
    <div ref={positionRef}>
      <FilterModal shortName={shortName} open={filterVisible} onClose={handleFilterClose} />
      <CalendarModal open={calendarVisible} onClose={handleCalendarClose} archive={archive} key={shortName} />
      <GroupModal shortName={shortName} open={groupVisible} onClose={handleGroupClose} />

      <Sidebar as={Menu} animation='overlay' inverted vertical visible={sidebarOpened}
        onClick={handlePusherClick} duration={50} width='thin'>
        <Menu.Item onClick={handlePusherClick} >
          <span> </span><Icon name="close" inverted={true} link={true} size='small' /></Menu.Item>
        <Link to="/"><Menu.Item link>Home</Menu.Item></Link>
        <Link to="/systems"><Menu.Item link>Systems</Menu.Item></Link>
        <Link to="/about"><Menu.Item link>About</Menu.Item></Link>
      </Sidebar>
      <Menu fixed="top">
        <Menu.Item onClick={handleSidebarToggle}>
          <Icon name='sidebar' />
        </Menu.Item>
        <Menu.Item name='filter-btn' onClick={handleFilterToggle}>
          <Icon name="filter" />
          <span className="desktop-only">Filter</span>
          <Label horizontal={true} color="grey" className="desktop-only">{filterLabel}</Label>
        </Menu.Item>
        <Container className="desktop-only" textAlign='center' style={{ fontSize: '1.5rem', paddingLeft: '1em', paddingTop: '.5em' }}>
          {/*system && system.name*/}
        </Container>
        <Menu.Menu position="right">
          <Menu.Item name='archive-btn' onClick={handleCalendarToggle} active={!live}>
            <Icon name="calendar" />
            <span className="desktop-only">
              {
                archiveLabel
                  ? archiveLabel
                  : "Archive"
              }
            </span>
          </Menu.Item>
          <Menu.Item name='live-btn' onClick={handleLiveToggle} active={live}>
            <Icon name="unmute" />
            <span className="desktop-only">Live</span>
          </Menu.Item>
        </Menu.Menu>
      </Menu>

      <Container className="main">
        <Sidebar.Pushable>
          <Sidebar.Pusher
            onClick={handlePusherClick}
            style={{ minHeight: '100vh' }}
          >
            <div ref={loadNewerRef} />
            <ListCalls callsData={callsData} activeCallId={currentCallId} talkgroups={talkgroupsData} playCall={playCall} />
            <div ref={loadOlderRef} style={{ height: 50 }} />


          </Sidebar.Pusher>
        </Sidebar.Pushable>
        <Rail position='right' className="desktop-only" dimmed={sidebarOpened ? "true" : "false"} >
          <Sticky offset={60} context={positionRef}>
            <CallInfo call={currentCall} header={callInfoHeader} link={callLink} />
          </Sticky>
        </Rail>
      </Container>

      <Menu fixed="bottom" compact inverted >
        <Menu.Item active={autoPlay} onClick={() => setAutoPlay(!autoPlay)}><Icon name="level up" /><span className="desktop-only">Autoplay</span></Menu.Item>
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
