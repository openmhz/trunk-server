import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';

import FilterModal from "./components/FilterModal";
import GroupModal from "./components/GroupModal";

import CalendarModal from "./components/CalendarModal";
import CallPlayer from "./CallPlayer";

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
function Calls(props) {

  const { shortName } = useParams();

  const { data: groupsData, isSuccess: isGroupsSuccess } = useGetGroupsQuery(shortName);
  const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);


  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [urlOptions, setUrlOptions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [groupVisible, setGroupVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [selectCallId, setSelectCallId] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const positionRef = useRef(); // lets us get the Y Scroll offset for the Call List
  const pageYOffset = useRef(); // Store the current Scroll Offset in a way that guarantees the latest value is available when Call Data is updated
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


  if (currentCall) {
    currentCallId = currentCall._id;
  }


  const handlePusherClick = () => {
    if (sidebarOpened) setSidebarOpened(false);
  }

  const handleSidebarToggle = () => setSidebarOpened(!sidebarOpened);
  const handleFilterToggle = () => setFilterVisible(!filterVisible);
  const handleCalendarToggle = () => setCalendarVisible(!calendarVisible);




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

        pageYOffset.current = positionRef.current.clientHeight;

        setSelectCallId(message._id);
        dispatch(addCall(message));

        console.log("Got: " + message._id);
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
      dispatch(setLive(true));
      setCurrentCall(false);
      dispatch(getCalls({}));

      startSocket();
    }
  }

  const handleCalendarClose = (didUpdate) => {
    setCalendarVisible(!calendarVisible);

    if (didUpdate) {
      dispatch(setLive(false));
      setCurrentCall(false);
      stopSocket();
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
    let filter = {
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
      setSelectCallId(_id);
      setAutoPlay(false);
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
  }, [filterGroupId, filterTalkgroups, filterType, filterDate, filterStarred, selectCallId])


  useEffect(() => {
    if (!urlOptions && groupsData && (groupsData.length > 0)) {
      setGroupVisible(true);
    }
  }, [groupsData])

  useLayoutEffect( () => {
    const scrollAmount = parseInt(positionRef.current.clientHeight) - parseInt(pageYOffset.current);
    if (scrollAmount > 0) {
      window.scrollBy(0, scrollAmount);
    }
  }, [callsData])


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

       <CallPlayer callsData={callsData}  selectCallId={selectCallId} />     

    </div>
  );
}


export default Calls;
