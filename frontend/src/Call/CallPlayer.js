import React, {  useEffect, useState } from "react";
import { Link, useLocation} from 'react-router-dom';
import { useParams } from "react-router-dom";
import MediaPlayer from "./MediaPlayer";
import FilterModal from "./FilterModal";
import GroupModal from "./GroupModal";
import SupportModal from "./SupportModal";
import CalendarModal from "./CalendarModalContainer";
import CallInfo from "./CallInfo";
import ListCalls from "./ListCalls";
import { useSelector, useDispatch } from 'react-redux'
import { setLive } from "../features/callPlayer/callPlayerSlice";
import { getCalls} from "../features/calls/callsSlice";
import { useGetGroupsQuery, useGetTalkgroupsQuery } from '../features/api/apiSlice'
import { selectAllCalls, useGetCallsQuery, callsAdapter } from "../features/calls/callsSlice";
import {
  Container,
  Label,
  Rail,
  Sticky,
  Menu,
  Icon,
  Sidebar,
  Visibility
} from "semantic-ui-react";
import "./CallPlayer.css";
//import setupSocket from '../socket/SetupSocket.js'
import queryString from '../query-string';

import { setShortName } from "./call-actions";





// ----------------------------------------------------
function CallPlayer (props) {

    const { shortName } = useParams();
    const { data:groupsData, isSuccess:isGroupsSuccess } = useGetGroupsQuery(shortName);
    //const { data:callsData, isSuccess:isCallsSuccess } = useGetCallsQuery({shortName});
    const {loading, data: callsData} = useSelector((state) => state.calls);
    
    //console.log(callsData);
    const { data:talkgroupsData, isSuccess:isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
    //const allCalls  = callsData?callsData.ids.map( id => callsData.entities[id] ):[]
    const [requestMessage, setRequestMessage] = useState("");
    const [callUrl, setCallUrl] = useState("");
    const [autoPlay, setAutoPlay] = useState(true);
    const [callId, setCallId] = useState(false);
    const [playTime, setPlayTime] = useState(0);
    const [callScroll, setCallScroll] = useState(false);
    const [callSelect, setCallSelect] = useState(false);
    const [urlOptions, setUrlOptions] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sidebarOpened, setSidebarOpened] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [groupVisible, setGroupVisible] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);
    
    const dispatch = useDispatch();
    

    const filterType = useSelector((state) => state.callPlayer.filterType);
    const filterGroupId = useSelector((state) => state.callPlayer.filterGroupId);
    const filterTalkgroups = useSelector((state) => state.callPlayer.filterTalkgroups);
    const filterStarred = useSelector((state) => state.callPlayer.filterStarred);
    const filterDate = useSelector((state) => state.callPlayer.filterDate);
    const live = useSelector((state) => state.callPlayer.live);

    const uri = queryString.parse(useLocation().search);

  const switchAutoPlay = () => setAutoPlay(!autoPlay);
  const handlePlayPause = (playing) => setIsPlaying(playing);
 
 const handlePusherClick = () => {
    if (sidebarOpened) setSidebarOpened(false);
  }


  const handleSidebarToggle = () => setSidebarOpened(!sidebarOpened);
  const handleFilterToggle = () => setFilterVisible(!filterVisible);
  const handleCalendarToggle = () => setCalendarVisible(!calendarVisible);
  const handleLiveToggle = () => {
    dispatch(setLive(!live));
  }
  
  const audioRef = false;

  const loadNewerCalls = () => {

  }
  const loadOlderCalls = () => {

  }

  const playCall = (data) => {

  }

  const callEnded = () => {

  }
  /*const changeUrl = url => callActions.changeUrl(url)

  handleContextRef = contextRef => this.setState({ contextRef })
  loadNewerCalls() {

    console.log("Loading Newer Calls");
    callActions.fetchNewerCalls(newestCallTime.getTime());
  }

  loadOlderCalls() {

    console.log("Loading Older Calls");
    callActions.fetchOlderCalls(oldestCallTime.getTime());

  }*/


const getFilter = () => {
  
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
  /*
  const endSocket = () => {
    this.socket.removeAllListeners("new message");
    this.socket.removeAllListeners("reconnect");
  }
  setupSocket() {
    this.socket.on('new message', this.addCall);
    this.socket.on('reconnect', (attempts) => {
      console.log("Socket Reconnected after attempts: " + attempts); // true
      if (live) {
        var filter = this.getFilter();
        this.startSocket(shortName, filter.type, filter.code, filter.filterStarred);
      }
    })
  }
  startSocket(shortName, filterType = "", filterCode = "", filterStarred = false) {
    this.socket.emit("start", {
      filterCode: filterCode,
      filterType: filterType,
      filterName: "OpenMHz",
      filterStarred: filterStarred,
      shortName: shortName
    });
  }
  stopSocket() {
    this.socket.emit("stop");
  }
  handleLiveToggle() {
    if (!live) {
      callActions.setDateFilter(false);
      callActions.setLive(false);
      this.setState({ callUrl: "", callId: false });
      callActions.fetchCalls();
      var filter = this.getFilter();
      this.startSocket(shortName, filter.type, filter.code, filter.filterStarred);
    }
  }
*/
/*
  updateUri(props, state) {
    var search = "?"
    switch (props.filterType) {

      case 1:
        search = search + `filter-type=group&filter-code=${props.filterGroupId}`;
        break;
      case 2:
        search = search + `filter-type=talkgroup&filter-code=${props.filterTalkgroups}`;
        break;
      default:
      case 0:
        break;

    }
    if (state.callId) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `call-id=${state.callId}`
    }
    if (props.filterDate) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `time=${props.filterDate}`;
    }

    if (props.filterStarred) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `starred=true`;
    }

    history.push({
      pathname: history.location.pathname,
      search: search
    });
  }
*/

  const handleCalendarClose = (didUpdate) => {
    setCalendarVisible(!calendarVisible);

    if (didUpdate) {
      dispatchEvent(setLive(false));
      setCallId(false);
      setCallUrl("");
      //callActions.fetchCalls();
      //this.stopSocket();
      //this.socket.close();
    }
  }

  const handleGroupClose = (didUpdate) => {
    setGroupVisible(!groupVisible);
    //callActions.fetchCalls();
  }

  const handleFilterClose = (didUpdate) => {
    setFilterVisible(!filterVisible);

    if (didUpdate) {
      setCallUrl("");
      setCallId(false);
      //callActions.fetchCalls();
    }
  }
/*
  callEnded(data) {
    const audio = this.audioRef.current;
    const currentIndex = callsAllIds.findIndex(callId => callId === callId);
    if (autoPlay && (currentIndex > 0)) {
      const nextCallId = callsAllIds[currentIndex - 1];
      const nextCall = callsById[nextCallId];
      var callUrl = nextCall.url;

      this.setState({ callUrl: callUrl, callId: nextCallId, isPlaying: true }, () => { audio.playSource(callUrl) }); //scrollToComponent(this.currentCallRef.current);
      if (this.currentCallRef.current) {
        this.currentCallRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      callActions.fetchCallInfo(nextCallId);
    } else {
      this.setState({ isPlaying: false });
    }
  }

  playCall(data) {
    const audio = this.audioRef.current;
    var callUrl = data.call.url;
    this.setState({
      callUrl: callUrl,
      callId: data.call._id,
      isPlaying: true
    }, () => { audio.playSource(callUrl); }); //scrollToComponent(this.currentCallRef.current);
    callActions.fetchCallInfo(data.call._id);
  }

  addCall(data) {
    const message = JSON.parse(data)
    switch (message.type) {
      case 'calls':
        const refs = this.refs.current;
        callActions.addCall(message);
        const newCall = callsById[callsAllIds[0]];
        if (!isPlaying && autoPlay) {
          this.playCall({ call: newCall });
          if (this.currentCallRef.current) {
            this.currentCallRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
        break
      default:
        break
    }
  }*/

  const setStateFromUri = () => {
    var filter = {
      filterDate: false,
      filterType: 0,  // this is "all"
      filterTalkgroups: [],
      filterGroupId: false,
      filterStarred: false,
      live: true
    };

    // is there a star filter?
    if (uri.hasOwnProperty('starred')) {
      const starred = uri['starred'];
      filter.filterStarred = starred === 'true' ? true : false;
      this.setState({ urlOptions: true });
    }

    // is there a time based filter?
    if (uri.hasOwnProperty('time')) {
      const date = new Date(parseInt(uri['time']));
      filter.filterDate = date.getTime();
      filter.live = false;
      this.setState({ urlOptions: true });
    }

    // is this just for one call?
    if (uri.hasOwnProperty('call-id')) {
      const _id = uri['call-id'];
      const date = new Date(parseInt(uri['time']));

      filter.live = false;
      this.setState({
        callId: _id,
        urlOptions: true,
        autoPlay: false,
        callScroll: true,
        callSelect: true
      });
      //callActions.fetchCallInfo(_id);
      //callActions.setCallTime(date);
    }


    var filterType = "all";
    var filterCode = "";

    // is there a Filter set?
    if ((uri.hasOwnProperty('filter-code')) && (uri.hasOwnProperty('filter-type'))) {
      this.setState({ urlOptions: true });

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

    //callActions.setFilter(filter);
  }

  useEffect(() => {
    // When a time/date is provided in the URL, it will be added to the filter
    // When fetchCalls is called it will selected calls that are older
    //callActions.fetchCalls();
    //talkgroupActions.fetchTalkgroups(shortName);
    //groupActions.fetchGroups(shortName);
    //systemActions.fetchSystems();
    /*this.setupSocket();

    if (filter.live) {
      this.startSocket(shortName, filterType, filterCode, filter.filterStarred);
    }*/
    dispatch(setShortName(shortName));
    dispatch(getCalls({shortName}));
    return () => {
      //this.endSocket();
    };
  }, []);




  const compareArray = (a1, a2) => {
    var i = a1.length;
    while (i--) {
      if (a1[i] !== a2[i])
        return false;
    }
    return true
  }

   useEffect( () => {
    if (!urlOptions && groupsData && (groupsData.length > 0)) {
      setGroupVisible(true);
    }
   },[groupsData] )

   useEffect( () => {
    /*var typeString = 'all';
    var filterCode = '';
    switch (nextProps.filterType) {

      case 1:
        typeString = 'group';
        filterCode = nextProps.filterGroupId;
        break;
      case 2:
        typeString = 'talkgroup';
        filterCode = nextProps.filterTalkgroups;
        break;
      default:
      case 0:
        typeString = "all";
        filterCode = '';
        break;
    }

    this.updateUri(nextProps, nextState);
    if (live) {
      this.startSocket(shortName, typeString, filterCode, nextProps.filterStarred);
    }*/
   }, [filterType,filterTalkgroups,filterGroupId,filterStarred,filterDate])


   /*
  componentWillUpdate(nextProps, nextState) {


    const callsChanged = nextProps.callsAllIds[0] !== callsAllIds[0];
    if (callsChanged) {
      const { contextRef } = this.state;
      this.scrollPos = contextRef.scrollTop;
      this.prevHeight = contextRef.clientHeight;
      this.autoScroll = true;
    }


    if (callId && !callUrl) {
      const call = callsById[callId];
      if (call) {
        this.setState({ callUrl: call.url });
      }
    }
  }*/
/*
  componentDidUpdate(prevProps, prevState) {
    const { contextRef } = this.state
    //console.log( contextRef.clientHeight - this.prevHeight );
    if (this.autoScroll) {
      this.autoScroll = false;
      window.scrollBy(0, contextRef.clientHeight - this.prevHeight);
    }

    // scroll to a call once the calls have loaded
    if (callScroll && (callsAllIds.length > prevProps.callsAllIds.length)) {
      const call = callsById[callId];
      if (call) {
        this.setState({ callScroll: false });
        if (this.currentCallRef.current) {
          this.currentCallRef.current.scrollIntoView({
            behavior: "auto",
            block: "center",
          });
        }
        this.scrollPos = contextRef.scrollTop;
        this.prevHeight = contextRef.clientHeight;
      }
    }

    if (callSelect) {
      const call = callsById[callId];
      if (call) {
        const audio = this.audioRef.current;
        var callUrl = call.url;
        this.setState({
          callUrl: callUrl,
          isPlaying: true,
          callSelect: false
        }, () => { audio.playSource(callUrl); }); //scrollToComponent(this.currentCallRef.current);
      }
    }
  }*/

  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
 
    //const { contextRef } = this.state

    var archiveLabel = "";
    if (filterDate) {
      const filterDate = new Date(filterDate);
      archiveLabel = filterDate.toLocaleDateString() + " " + filterDate.toLocaleTimeString()
    }

    var callInfoHeader = "Call Info";

    const currentCall = false;//callsById[callId];


    var callsAllIds = [];
    var callsById = false;
    var callLink = ""
    var callDownload = ""
    if (currentCall) {
      if ((talkgroupsData) && talkgroupsData[currentCall.talkgroupNum]) {
        callInfoHeader = talkgroupsData[currentCall.talkgroupNum].description;
      }
      const callDate = new Date(currentCall.time);
      callLink = "/system/" + shortName + "?call-id=" + currentCall._id + "&time=" + (callDate.getTime() + 1);
      callDownload = currentCall.url;
    }
    var archive = process.env.REACT_APP_ARCHIVE_DAYS

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
    /*    if (calls) {
      var callRows = calls.map((call) =>
        <CallItem call={call} key={call.shortName}/>
      ))
    }*/
    return (
      <div >
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
              <Visibility onTopVisible={loadNewerCalls} onBottomVisible={loadOlderCalls} once={false}>
              <ListCalls callsData={callsData} currentCallRef={false} activeCallId={callId} talkgroups={talkgroupsData} playCall={playCall} />
             </Visibility>
            </Sidebar.Pusher>
          </Sidebar.Pushable>
          <Rail position='right' className="desktop-only" dimmed={sidebarOpened ? "true" : "false"} >
            <Sticky  offset={60}>
              <CallInfo call={currentCall} header={callInfoHeader} link={callLink}/>
            </Sticky>
          </Rail>
        </Container>

        <Menu fixed="bottom" compact inverted >
          <Menu.Item active={autoPlay} onClick={() => this.switchAutoPlay()}><Icon name="level up" /><span className="desktop-only">Autoplay</span></Menu.Item>
          { /*<MediaPlayer ref={audioRef} call={currentCall} onEnded={callEnded} onPlayPause={handlePlayPause} /> */ }
          <Menu.Menu position="right" className="desktop-only">
            <Menu.Item><SupportModal/></Menu.Item>
            <Menu.Item><a href={callDownload}><Icon name="download" />Download</a></Menu.Item>
            <Menu.Item><a href={callLink}><Icon name="at" />Link</a></Menu.Item>
          </Menu.Menu>
        </Menu>

      </div>





    );
  }


export default CallPlayer;
