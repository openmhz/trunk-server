import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import FilterModal from "./components/FilterModal";
import GroupModal from "./components/GroupModal";
import CalendarModal from "./components/CalendarModal";
import CallPlayer from "./CallPlayer";
import Activity from "./Activity";
import { useSelector, useDispatch, useStore } from 'react-redux'
import { setFilter, setDateFilter } from "../features/callPlayer/callPlayerSlice";
import { getCalls, addCall, getOlderCalls, getNewerCalls, clearCallsError } from "../features/calls/callsSlice";
import { useGetGroupsQuery, useGetSystemsQuery, } from '../features/api/apiSlice'
import {
  Container,
  Label,
  Menu,
  Icon,
  Sidebar,
  Message,
  Button,
  Loader,
  Sticky
} from "semantic-ui-react";
import "./CallPlayer.css";
import queryString from '../query-string';
import { getSocket, connectSocket } from '../socket';

// ----------------------------------------------------
function Calls(props) {

  const { shortName } = useParams();
  const { data: allSystems, isSuccess } = useGetSystemsQuery();
  const { data: groupsData, isSuccess: isGroupsSuccess } = useGetGroupsQuery(shortName);
  const { loading: callsLoading, data: callsData, error: callsError } = useSelector((state) => state.calls);
  const socket = getSocket();
  const store = useStore();

  const [autoPlay, setAutoPlay] = useState(true);
  const [urlOptions, setUrlOptions] = useState(false);
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [groupVisible, setGroupVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [activityVisible, setActivityVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [selectCallId, setSelectCallId] = useState(false);
  const [initialCallId, setInitialCallId] = useState(false);
  const [live, setLive] = useState(true);
  const [initShortName, setInitShortName] = useState(null); // which system the filter state was last initialised for
  const [errorDismissed, setErrorDismissed] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const pageYOffset = useRef(); // Store the current Scroll Offset in a way that guarantees the latest value is available when Call Data is updated
  // the socket handler is registered once, so it reads the latest values through refs
  const liveRef = useRef(true);
  const starredRef = useRef(false);
  const initialCallIdRef = useRef(false);
  const uri = queryString.parse(useLocation().search);
  const filterType = useSelector((state) => state.callPlayer.filterType);
  const filterGroupId = useSelector((state) => state.callPlayer.filterGroupId);
  const filterTalkgroups = useSelector((state) => state.callPlayer.filterTalkgroups);
  const filterStarred = useSelector((state) => state.callPlayer.filterStarred);
  const filterDate = useSelector((state) => state.callPlayer.filterDate);
  const storeShortName = useSelector((state) => state.callPlayer.shortName);
  // primitive form of the talkgroup list, so effects don't re-run for an equal list
  const talkgroupKey = filterTalkgroups.join(',');
  // Don't fetch or start the socket until the filter state belongs to this system
  // (otherwise the first pass would use the previous system's filters).
  const ready = (initShortName === shortName) && (storeShortName === shortName);
  liveRef.current = live;
  starredRef.current = filterStarred;
  initialCallIdRef.current = initialCallId;
  //const live = useSelector((state) => state.callPlayer.live);

  const pathname = useLocation().pathname;

  let system = useMemo(() => {
    if (allSystems) {
      return allSystems.systems.find((system) => system.shortName === shortName)
    } else {
      return false;
    }
  }, [allSystems, shortName])

  const handlePusherClick = () => {
    if (sidebarOpened) setSidebarOpened(false);
  }

  const handleSidebarToggle = () => setSidebarOpened(!sidebarOpened);
  const handleFilterToggle = () => setFilterVisible(!filterVisible);
  const handleCalendarToggle = () => setCalendarVisible(!calendarVisible);
  const handleActivityToggle = () => setActivityVisible(!activityVisible);
  const handleActivityNavigate = (tgNum, timestamp) =>{

    let filter = {
      filterDate: timestamp,
      filterType: 2,  // this is "all"
      filterTalkgroups: [tgNum],
      filterGroupId: false,
      filterStarred: false,
      shortName: shortName
    };

    dispatch(setFilter(filter));
    setLive(false);
    setActivityVisible(false)
  }

  const getFilterDescription = () => {
    let filter = { type: 'all', code: "", filterStarred: false };

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


  const startSocket = () => {
    const filter = getFilterDescription();
    console.log("Starting Socket - Filter Code: " + filter.code + " Filter Type: " + filter.type);
    socket.emit("start", {
      filterCode: filter.code,
      filterType: filter.type,
      filterName: "OpenMHz",
      filterStarred: filter.filterStarred,
      shortName: shortName
    });
  }

  const stopSocket = () => {
    // emitting while disconnected would buffer the event and replay it after a reconnect
    if (socket.connected) {
      console.log("Stopping Socket")
      socket.emit("stop");
    }
  }

  const updateUri = () => {
    let search = "?"
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

    if (initialCallId) {
      if (search.length !== 1) {
        search = search + '&';
      }
      search = search + `call-id=${initialCallId}`;
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
      setInitialCallId(false);
      setLive(true);
      if (filterDate) {
        dispatch(setDateFilter(false)); // the filter effect refetches
      } else {
        dispatch(getCalls({}));
      }
    }
  }

  const handleCalendarClose = (didUpdate) => {
    setCalendarVisible(!calendarVisible);

    if (didUpdate) {
      setLive(false);
    }
  }

  const handleGroupClose = (didUpdate) => {
    setGroupVisible(!groupVisible);
  }

  const handleFilterClose = (didUpdate) => {
    setFilterVisible(!filterVisible);
  }


  const handleNewer = () => {
    if (positionRef.current) {
      pageYOffset.current = { direction: "top", position: positionRef.current.clientHeight };
    }
    if (!live) {
      dispatch(getNewerCalls({}));
    }
  }

  const handleOlder = () => {
    if (positionRef.current) {
      pageYOffset.current = { direction: "bottom", position: positionRef.current.clientHeight };
    }
    dispatch(getOlderCalls({}));
  }

  useLayoutEffect(() => {
    if (pageYOffset.current && positionRef.current) {
      const scrollAmount = parseInt(positionRef.current.clientHeight) - parseInt(pageYOffset.current.position);
      if (pageYOffset.current.direction === "top") {
        window.scrollBy({ left: 0, top: scrollAmount, behavior: "auto" });
        pageYOffset.current = { direction: "bottom", position: positionRef.current.clientHeight }; // reset PageY to be the current height incase callsData changes for other reasons
      } else {
        pageYOffset.current = { direction: "bottom", position: positionRef.current.clientHeight };
        //window.scrollBy(0, -1 * scrollAmount);
      }
    }
  }, [callsData])




  const setStateFromUri = () => {
  
    let filter = {
      filterDate: false,
      filterType: 0,  // this is "all"
      filterTalkgroups: [],
      filterGroupId: false,
      filterStarred: false,
      filterCallId: false,
      shortName: shortName
    };

    let isLive = true;
    let callId = false;

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
      isLive = false;
      //filter.live = false;
      if (!urlOptions) setUrlOptions(true);
    }

    // is this just for one call?
    if (uri.hasOwnProperty('call-id')) {
      const _id = uri['call-id'];
      callId = _id;
      filter.filterCallId = false;
      setAutoPlay(false);
      isLive = false;
      if (!urlOptions) setUrlOptions(true);
    }

    // is there a Filter set?
    if ((uri.hasOwnProperty('filter-code')) && (uri.hasOwnProperty('filter-type'))) {
      if (!urlOptions) setUrlOptions(true);

      // The Filter is a group
      if (uri['filter-type'] === "group") {
        filter.filterType = 1;
        filter.filterGroupId = uri["filter-code"];
      }

      // The Filter is talkgroups
      if (uri['filter-type'] === 'talkgroup') {
        const tg = uri["filter-code"].split(',').map(Number);
        filter.filterType = 2;
        filter.filterTalkgroups = tg;
      }
    }

    setLive(isLive);
    setInitialCallId(callId);
    dispatch(setFilter(filter));
    setInitShortName(shortName);
  }




  // Initialise the filter state from the URL whenever the system changes
  useEffect(() => {
    setStateFromUri();
  }, [shortName]);

  // Socket wiring: one shared connection, every handler removed on unmount
  useEffect(() => {
    const onConnect = () => {
      console.log("Socket Connect");
      setIsConnected(true);
    };
    const onDisconnect = () => {
      console.log("Socket Disconnect");
      setIsConnected(false);
    };
    // "reconnect" is a Manager event in socket.io v4. "connect" also fires after a
    // reconnect; the start effect below re-sends `start` when isConnected flips back on.
    const onReconnect = (attempts) => {
      console.log("Socket Reconnected after attempts: " + attempts);
      setIsConnected(socket.connected);
    };
    const onMessage = (data) => {
      let message;
      try {
        message = JSON.parse(data);
      } catch (e) {
        return;
      }
      if (!message || message.type !== 'calls') return;
      if (!liveRef.current) return; // ignore anything that arrives after leaving live mode
      if (starredRef.current && !message.star) return; // starred-only view: the server doesn't filter live calls
      // keep the scroll position steady when the user is scrolled down the list
      if (positionRef.current && window.scrollY > 0) {
        pageYOffset.current = { direction: "top", position: positionRef.current.clientHeight };
      }
      const playingId = store.getState().callPlayer.currentCallId;
      dispatch(addCall(message, [playingId, initialCallIdRef.current]));
      setSelectCallId(message._id);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect', onReconnect);
    socket.on('new message', onMessage);
    connectSocket();
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect', onReconnect);
      socket.off('new message', onMessage);
    };
  }, []);

  // (Re)load the call list when the system or a filter changes
  useEffect(() => {
    if (!ready) return;
    dispatch(getCalls({}));
  }, [ready, shortName, filterGroupId, talkgroupKey, filterType, filterDate, filterStarred])

  // Tell the server what to send. Re-runs after a reconnect (isConnected) without refetching.
  useEffect(() => {
    if (!ready || !live || !isConnected) return;
    startSocket();
    return () => {
      stopSocket();
    };
  }, [ready, live, isConnected, shortName, filterGroupId, talkgroupKey, filterType, filterStarred])

  // Update the Browser URI only when the user changes something that belongs in it
  useEffect(() => {
    if (!ready) return;
    updateUri();
  }, [ready, filterGroupId, talkgroupKey, filterType, filterDate, filterStarred, initialCallId])

  // Retry a failed list load automatically, and let the user dismiss the message
  useEffect(() => {
    setErrorDismissed(false);
    if (callsError && callsError.source === 'getCalls') {
      const timer = setTimeout(() => dispatch(getCalls({})), 10000);
      return () => clearTimeout(timer);
    }
  }, [callsError])

  const handleRetry = () => {
    dispatch(clearCallsError());
    if (callsError && callsError.source === 'getOlderCalls') {
      dispatch(getOlderCalls({}));
    } else if (callsError && callsError.source === 'getNewerCalls') {
      dispatch(getNewerCalls({}));
    } else {
      dispatch(getCalls({}));
    }
  }

  useEffect(() => {
    if (!urlOptions && groupsData && (groupsData.length > 0)) {
      setGroupVisible(true);
    }
  }, [groupsData])


  const setPositionRef = node => positionRef.current = node;


  let archiveLabel = "";
  if (filterDate) {
    const filterDateObj = new Date(filterDate);
    archiveLabel = filterDateObj.toLocaleDateString() + " " + filterDateObj.toLocaleTimeString()
  }

  const archive = process.env.REACT_APP_ARCHIVE_DAYS

  let filterLabel = "All"
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
    <div ref={setPositionRef}>
      <FilterModal shortName={shortName} open={filterVisible} onClose={handleFilterClose} />
      <CalendarModal open={calendarVisible} onClose={handleCalendarClose} archive={archive} key={shortName} />
      <GroupModal shortName={shortName} open={groupVisible} onClose={handleGroupClose} />

      <Sidebar as={Menu} animation='overlay' inverted vertical visible={sidebarOpened}
        onClick={handlePusherClick} duration={50} width='thin'>
        <Menu.Item onClick={handlePusherClick} >
          <span> </span><Icon name="close" inverted={true} link={true} size='small' /></Menu.Item>
        <Link to="/"><Menu.Item link>Home</Menu.Item></Link>
        <Link to="/systems"><Menu.Item link>Systems</Menu.Item></Link>
        <Link to="/events"><Menu.Item link>Events</Menu.Item></Link>
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
          {system && system.name}
        </Container>
        <Menu.Menu position="right">
          <Menu.Item name='atcivity-btn' onClick={handleActivityToggle} active={activityVisible}>
            <Icon name="line graph" />
            <span >Activity</span>
          </Menu.Item>
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

      {callsError && !errorDismissed &&
        <Message warning onDismiss={() => setErrorDismissed(true)}
          style={{ position: 'fixed', top: '4em', left: '1em', right: '1em', zIndex: 900 }}>
          <Message.Header>Couldn't load calls{callsError.source === 'getCalls' ? ' — retrying' : ''}</Message.Header>
          <p>{callsError.message} <Button size="mini" compact onClick={handleRetry}>Retry</Button></p>
        </Message>
      }
      {callsLoading && callsData.ids.length === 0 &&
        <Loader active inline="centered" style={{ marginTop: '8em' }} />
      }
      {activityVisible
        ? <Activity navigate={handleActivityNavigate} />
        : <CallPlayer system={system} callsData={callsData} selectCallId={selectCallId} initialCallId={initialCallId} handleNewer={handleNewer} handleOlder={handleOlder} />
      }
    </div>
  );
}


export default Calls;
