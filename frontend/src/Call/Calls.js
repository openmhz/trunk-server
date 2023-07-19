import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import FilterModal from "./components/FilterModal";
import GroupModal from "./components/GroupModal";
import CalendarModal from "./components/CalendarModal";
import CallPlayer from "./CallPlayer";
import Activity from "./Activity";
import { useSelector, useDispatch } from 'react-redux'
import { setFilter, setDateFilter } from "../features/callPlayer/callPlayerSlice";
import { getCalls, addCall, getOlderCalls, getNewerCalls } from "../features/calls/callsSlice";
import { useGetGroupsQuery, useGetSystemsQuery, } from '../features/api/apiSlice'
import {
  Container,
  Label,
  Menu,
  Icon,
  Sidebar
} from "semantic-ui-react";
import "./CallPlayer.css";
import queryString from '../query-string';
import io from 'socket.io-client';



const socket = io(process.env.REACT_APP_BACKEND_SERVER);

// ----------------------------------------------------
function Calls(props) {

  const { shortName } = useParams();
  const { data: allSystems, isSuccess } = useGetSystemsQuery();
  const { data: groupsData, isSuccess: isGroupsSuccess } = useGetGroupsQuery(shortName);
  const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);

  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [urlOptions, setUrlOptions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [groupVisible, setGroupVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [activityVisible, setActivityVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [selectCallId, setSelectCallId] = useState(false);
  const [initialCallId, setInitialCallId] = useState(false);
  const [live, setLive] = useState(true);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const pageYOffset = useRef(); // Store the current Scroll Offset in a way that guarantees the latest value is available when Call Data is updated
  const shouldPlayAddCallRef = useRef(); // we need to do this to make the current value of isPlaying available in the socket message callback
  shouldPlayAddCallRef.current = (!isPlaying && autoPlay) ? true : false;
  const uri = queryString.parse(useLocation().search);
  const filterType = useSelector((state) => state.callPlayer.filterType);
  const filterGroupId = useSelector((state) => state.callPlayer.filterGroupId);
  const filterTalkgroups = useSelector((state) => state.callPlayer.filterTalkgroups);
  const filterStarred = useSelector((state) => state.callPlayer.filterStarred);
  const filterDate = useSelector((state) => state.callPlayer.filterDate);
  //const live = useSelector((state) => state.callPlayer.live);

  const pathname = useLocation().pathname;

  let currentCallId = false;
  //let system = false;

  if (currentCall) {
    currentCallId = currentCall._id;
  }

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
    stopSocket();
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


  const handleSocketMessage = (data) => {
    const message = JSON.parse(data)
    switch (message.type) {
      case 'calls':

        if (positionRef.current) {
          pageYOffset.current = { direction: "top", position: positionRef.current.clientHeight };
        }
        setSelectCallId(message._id);
        dispatch(addCall(message));
        const time = new Date(message.time);
        console.log("Got Socket Message: " + message._id + " Start Time: " + time.toLocaleTimeString());
        break
      default:
        break
    }
  }

  const startSocket = () => {
    const filter = getFilterDescription();
    console.log("Starting Socket - Filter Code: " + filter.code + " Filter Type: " + filter.type);
    socket.emit("start", {
      filterCode: filter.code,
      filterType: filter.type,
      filterName: "OpenMHz",
      filterStarred: filter.starred,
      shortName: shortName
    });
  }

  const stopSocket = () => {
    console.log("Stopping Socket")
    socket.emit("stop");
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

  const handleLiveToggle = (currentlyLive) => {
    if (!live) {
      dispatch(setDateFilter(false));
      dispatch(getCalls({}));
      setLive(true);
      startSocket();
    }
  }

  const handleCalendarClose = (didUpdate) => {
    setCalendarVisible(!calendarVisible);

    if (didUpdate) {
      setLive(false);
      stopSocket();
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
    if (pageYOffset.current) {
      const scrollAmount = parseInt(positionRef.current.clientHeight) - parseInt(pageYOffset.current.position);
      if (pageYOffset.current.direction == "top") {
        window.scrollBy({ left: 0, top: scrollAmount, behavior: "auto" });
        pageYOffset.current = { direction: "bottom", position: positionRef.current.clientHeight }; // reset PageY to be the current height incase callsData changes for other reasons
      } else {
        pageYOffset.current = { direction: "bottom", position: positionRef.current.clientHeight };
        //window.scrollBy(0, -1 * scrollAmount);
      }
    }
  }, [callsData])




  const setStateFromUri = async () => {
  
    let filter = {
      filterDate: false,
      filterType: 0,  // this is "all"
      filterTalkgroups: [],
      filterGroupId: false,
      filterStarred: false,
      filterCallId: false,
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
      setLive(false);
      //filter.live = false;
      if (!urlOptions) setUrlOptions(true);
    }

    // is this just for one call?
    if (uri.hasOwnProperty('call-id')) {
      const _id = uri['call-id'];
      setInitialCallId(_id);
      filter.filterCallId = false;
      setAutoPlay(false);
      setLive(false);
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

    dispatch(setFilter(filter));
  }


  useEffect(() => {
    setStateFromUri();
    return () => {
      stopSocket();
    };
  }, []);




  useEffect(() => {
    socket.on('connect', () => {
      console.log("Socket Connect");
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log("Socket Disconnect");
      setIsConnected(false);
    });

    socket.on('reconnect', (attempts) => {
      console.log("Socket Reconnected after attempts: " + attempts); // true
      setIsConnected(true);
    })

    socket.on("new message", handleSocketMessage);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, []);

  useEffect(() => {

      dispatch(getCalls({}));
  
    if (live && isConnected) {
      startSocket();
    }
  }, [shortName, filterGroupId, filterTalkgroups, filterType, filterDate, filterStarred, isConnected])


  // Update the Browser URI when any relevant values change
  useEffect(() => {
    updateUri();
  }, [filterGroupId, filterTalkgroups, filterType, filterDate, filterStarred, selectCallId, initialCallId])

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
      {activityVisible
        ? <Activity navigate={handleActivityNavigate} />
        : <CallPlayer callsData={callsData} selectCallId={selectCallId} initialCallId={initialCallId} handleNewer={handleNewer} handleOlder={handleOlder} />
      }
    </div>
  );
}


export default Calls;
