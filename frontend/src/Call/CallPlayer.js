import React from "react";
import { Link } from 'react-router-dom';
import MediaPlayer from "./MediaPlayer";
import FilterModal from "./FilterModalContainer";
import GroupModal from "./GroupModalContainer";
import SupportModal from "./SupportModal";
import CalendarModal from "./CalendarModalContainer";
import CallInfo from "./CallInfo";
import ListCalls from "./ListCalls";
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






// ----------------------------------------------------
class CallPlayer extends React.Component {

  constructor(props) {
    super(props);
    this.loadNewerCalls = this.loadNewerCalls.bind(this);
    this.loadOlderCalls = this.loadOlderCalls.bind(this);
    this.playCall = this.playCall.bind(this);
    this.updateUri = this.updateUri.bind(this);
    this.switchAutoPlay = this.switchAutoPlay.bind(this);
    this.callEnded = this.callEnded.bind(this);
    this.addCall = this.addCall.bind(this);
    this.handlePusherClick = this.handlePusherClick.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
    this.handleSupportToggle = this.handleSupportToggle.bind(this);
    this.handleFilterClose = this.handleFilterClose.bind(this);
    this.handleGroupClose = this.handleGroupClose.bind(this);
    this.handleSupportClose = this.handleSupportClose.bind(this);
    this.handleCalendarToggle = this.handleCalendarToggle.bind(this);
    this.handleCalendarClose = this.handleCalendarClose.bind(this);
    this.handleLiveToggle = this.handleLiveToggle.bind(this);
    this.handlePlayPause = this.handlePlayPause.bind(this);
    this.getFilter = this.getFilter.bind(this);
    this.socket = window.socket;
    this.setupSocket = this.setupSocket.bind(this);
    this.endSocket = this.endSocket.bind(this);
    this.changeUrl = this.changeUrl.bind(this);
    this.audioRef = React.createRef();
    this.currentCallRef = React.createRef();
    this.state = {
      requestMessage: "",
      callUrl: "",
      autoPlay: true,
      callId: false,
      playTime: 0,
      sourceIndex: 0,
      callScroll: false,
      callSelect: false,
      urlOptions: false,
      isPlaying: false,
      sidebarOpened: false,
      filterVisible: false,
      groupVisible: false,
      calendarVisible: false,
      supportVisible: false
    }
  }

  switchAutoPlay = () => this.setState({
    autoPlay: !this.state.autoPlay
  })
  handlePlayPause = (playing) => this.setState({
    isPlaying: playing
  })
  handlePusherClick = () => {
    const { sidebarOpened } = this.state

    if (sidebarOpened) this.setState({ sidebarOpened: false })
  }

  handleSidebarToggle = () => this.setState({ sidebarOpened: !this.state.sidebarOpened })

  handleFilterToggle = () => this.setState({
    filterVisible: !this.state.filterVisible
  })

  handleSupportToggle = () => this.setState({
    supportVisible: !this.state.supportVisible
  })

  handleContextRef = contextRef => this.setState({ contextRef })
  changeUrl = url => this.props.callActions.changeUrl(url)

  loadNewerCalls() {

    console.log("Loading Newer Calls");
    this.props.callActions.fetchNewerCalls(this.props.newestCallTime.getTime());
  }

  loadOlderCalls() {

    console.log("Loading Older Calls");
    this.props.callActions.fetchOlderCalls(this.props.oldestCallTime.getTime());

  }

  handleCalendarToggle = () => this.setState({
    calendarVisible: !this.state.calendarVisible
  })

  getFilter() {
    var filter = { type: 'all', code: "", filterStarred: false };
    switch (this.props.filterType) {
      case 1:
        filter.type = "group";
        filter.code = this.props.filterGroupId;
        break;
      case 2:
        filter.type = "talkgroup";
        filter.code = this.props.filterTalkgroups;
        break;
      default:
      case 0:
        filter.type = "all";
        filter.code = ""
    }
    filter.filterStarred = this.props.filterStarred;
    return filter;
  }
  endSocket() {
    this.socket.removeAllListeners("new message");
    this.socket.removeAllListeners("reconnect");
  }
  setupSocket() {
    this.socket.on('new message', this.addCall);
    this.socket.on('reconnect', (attempts) => {
      console.log("Socket Reconnected after attempts: " + attempts); // true
      if (this.props.live) {
        var filter = this.getFilter();
        this.startSocket(this.props.shortName, filter.type, filter.code, filter.filterStarred);
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
    if (!this.props.live) {
      this.props.callActions.setDateFilter(false);
      this.props.callActions.setLive(false);
      this.setState({ callUrl: "", callId: false });
      this.props.callActions.fetchCalls();
      var filter = this.getFilter();
      this.startSocket(this.props.shortName, filter.type, filter.code, filter.filterStarred);
    }
  }

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

    this.props.history.push({
      pathname: this.props.history.location.pathname,
      search: search
    });
  }

  handleCalendarClose(didUpdate) {
    this.setState({
      calendarVisible: !this.state.calendarVisible
    });
    if (didUpdate) {
      this.props.callActions.setLive(false);
      this.props.callActions.fetchCalls();

      this.setState({ callUrl: "", callId: false });
      this.stopSocket();
      //this.socket.close();

    }
  }

  handleGroupClose(didUpdate) {
    this.setState({
      groupVisible: !this.state.groupVisible
    });
    this.props.callActions.fetchCalls();
  }

  handleSupportClose() {
    this.setState({
      supportVisible: !this.state.supportVisible
    });
  }

  handleFilterClose(didUpdate) {
    this.setState({
      filterVisible: !this.state.filterVisible
    });
    if (didUpdate) {
      this.setState({ callUrl: "", callId: false });
      this.props.callActions.fetchCalls();
    }
  }

  callEnded(data) {
    const audio = this.audioRef.current;
    const currentIndex = this.props.callsAllIds.findIndex(callId => callId === this.state.callId);
    if (this.state.autoPlay && (currentIndex > 0)) {
      const nextCallId = this.props.callsAllIds[currentIndex - 1];
      const nextCall = this.props.callsById[nextCallId];
      var callUrl = nextCall.url;

      this.setState({ callUrl: callUrl, callId: nextCallId, sourceIndex: 0, isPlaying: true }, () => { audio.playSource(callUrl) }); //scrollToComponent(this.currentCallRef.current);
      if (this.currentCallRef.current) {
        this.currentCallRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      this.props.callActions.fetchCallInfo(nextCallId);
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
      sourceIndex: 0,
      isPlaying: true
    }, () => { audio.playSource(callUrl); }); //scrollToComponent(this.currentCallRef.current);
    this.props.callActions.fetchCallInfo(data.call._id);
  }

  addCall(data) {
    const message = JSON.parse(data)
    switch (message.type) {
      case 'calls':
        const refs = this.refs.current;
        this.props.callActions.addCall(message);
        const newCall = this.props.callsById[this.props.callsAllIds[0]];
        if (!this.state.isPlaying && this.state.autoPlay) {
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
  }
  componentWillUnmount() {
    this.endSocket();
  }
  componentDidMount() {
    //const parsed = queryString.parse(location.search);
    //console.log(parsed);
    this.props.callActions.setShortName(this.props.shortName);
    var filter = {
      filterDate: false,
      filterType: 0,  // this is "all"
      filterTalkgroups: [],
      filterGroupId: false,
      filterStarred: false,
      live: true
    };
    const uri = queryString.parse(this.props.location.search);

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
        sourceIndex: 0,
        urlOptions: true,
        autoPlay: false,
        callScroll: true,
        callSelect: true
      });
      this.props.callActions.fetchCallInfo(_id);
      this.props.callActions.setCallTime(date);


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

    this.props.callActions.setFilter(filter);

    // When a time/date is provided in the URL, it will be added to the filter
    // When fetchCalls is called it will selected calls that are older
    this.props.callActions.fetchCalls();
    this.props.talkgroupActions.fetchTalkgroups(this.props.shortName);
    this.props.groupActions.fetchGroups(this.props.shortName);
    this.props.systemActions.fetchSystems();
    this.setupSocket();

    if (filter.live) {
      this.startSocket(this.props.shortName, filterType, filterCode, filter.filterStarred);
    }
  }
  compareArray(a1, a2) {
    var i = a1.length;
    while (i--) {
      if (a1[i] !== a2[i])
        return false;
    }
    return true
  }

  componentWillUpdate(nextProps, nextState) {
    if (!this.props.groups && nextProps.groups) {
      if (!this.state.urlOptions && (nextProps.groups.length > 0)) {
        this.setState({
          groupVisible: true
        });
      }
    }

    const filterChanged = (nextProps.filterType !== this.props.filterType) || !this.compareArray(nextProps.filterTalkgroups, this.props.filterTalkgroups) || (nextProps.filterGroupId !== this.props.filterGroupId) || (nextProps.filterDate !== this.props.filterDate) || (nextProps.filterStarred !== this.props.filterStarred);
    if (filterChanged) {
      var typeString = 'all';
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
      if (this.props.live) {
        this.startSocket(this.props.shortName, typeString, filterCode, nextProps.filterStarred);
      }
    }

    const callsChanged = nextProps.callsAllIds[0] !== this.props.callsAllIds[0];
    if (callsChanged) {
      const { contextRef } = this.state;
      this.scrollPos = contextRef.scrollTop;
      this.prevHeight = contextRef.clientHeight;
      this.autoScroll = true;
    }
    /* // if you do this, you also need to update time in the URI to be the call time...
    if (this.state.callId != nextState.callId) {
      this.updateUri(nextProps, nextState);
    }*/

    if (this.state.callId && !this.state.callUrl) {
      const call = this.props.callsById[this.state.callId];
      if (call) {
        this.setState({ callUrl: call.url });
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { contextRef } = this.state
    //console.log( contextRef.clientHeight - this.prevHeight );
    if (this.autoScroll) {
      this.autoScroll = false;
      window.scrollBy(0, contextRef.clientHeight - this.prevHeight);
    }

    // scroll to a call once the calls have loaded
    if (this.state.callScroll && (this.props.callsAllIds.length > prevProps.callsAllIds.length)) {
      const call = this.props.callsById[this.state.callId];
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

    if (this.state.callSelect) {
      const call = this.props.callsById[this.state.callId];
      if (call) {
        const audio = this.audioRef.current;
        var callUrl = call.url;
        this.setState({
          callUrl: callUrl,
          sourceIndex: 0,
          isPlaying: true,
          callSelect: false
        }, () => { audio.playSource(callUrl); }); //scrollToComponent(this.currentCallRef.current);
      }
    }
  }

  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const { contextRef } = this.state
    const { sidebarOpened } = this.state
    var archiveLabel = "";
    if (this.props.filterDate) {
      const filterDate = new Date(this.props.filterDate);
      archiveLabel = filterDate.toLocaleDateString() + " " + filterDate.toLocaleTimeString()
    }

    var callInfoHeader = "Call Info";

    const currentCall = this.props.callsById[this.state.callId];

    var callLink = ""
    var callDownload = ""
    if (currentCall) {
      if ((this.props.talkgroups) && this.props.talkgroups[currentCall.talkgroupNum]) {
        callInfoHeader = this.props.talkgroups[currentCall.talkgroupNum].description;
      }
      const callDate = new Date(currentCall.time);
      callLink = "/system/" + this.props.shortName + "?call-id=" + currentCall._id + "&time=" + (callDate.getTime() + 1);
      callDownload = currentCall.url;
    }
    var archive = process.env.REACT_APP_ARCHIVE_DAYS

    var filterLabel = "All"
    switch (this.props.filterType) {
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
    /*    if (this.props.calls) {
      var callRows = calls.map((call) =>
        <CallItem call={call} key={call.shortName}/>
      ))
    }*/
    return (
      <div ref={this.handleContextRef}>
        <FilterModal shortName={this.props.shortName} open={this.state.filterVisible} onClose={this.handleFilterClose} />
        <CalendarModal open={this.state.calendarVisible} onClose={this.handleCalendarClose} archive={archive} key={this.props.shortName} />
        <GroupModal shortName={this.props.shortName} open={this.state.groupVisible} onClose={this.handleGroupClose} />
        <SupportModal open={this.state.supportVisible} onClose={this.handleSupportClose} />
        <Sidebar as={Menu} animation='overlay' inverted vertical visible={sidebarOpened}
          onClick={this.handlePusherClick} duration={50} width='thin'>
          <Menu.Item onClick={this.handlePusherClick} >
            <span> </span><Icon name="close" inverted={true} link={true} size='small' /></Menu.Item>
          <Link to="/"><Menu.Item link>Home</Menu.Item></Link>
          <Link to="/systems"><Menu.Item link>Systems</Menu.Item></Link>
          <Link to="/about"><Menu.Item link>About</Menu.Item></Link>
        </Sidebar>
        <Menu fixed="top">
          <Menu.Item onClick={this.handleSidebarToggle}>
            <Icon name='sidebar' />
          </Menu.Item>
          <Menu.Item name='filter-btn' onClick={this.handleFilterToggle}>
            <Icon name="filter" />
            <span className="desktop-only">Filter</span>
            <Label horizontal={true} color="grey" className="desktop-only">{filterLabel}</Label>
          </Menu.Item>
          <Container className="desktop-only" textAlign='center' style={{ fontSize: '1.5rem', paddingLeft: '1em', paddingTop: '.5em' }}>
            {this.props.system && this.props.system.name}
          </Container>
          <Menu.Menu position="right">
            <Menu.Item name='archive-btn' onClick={this.handleCalendarToggle} active={!this.props.live}>
              <Icon name="calendar" />
              <span className="desktop-only">
                {
                  archiveLabel
                    ? archiveLabel
                    : "Archive"
                }
              </span>
            </Menu.Item>
            <Menu.Item name='live-btn' onClick={this.handleLiveToggle} active={this.props.live}>
              <Icon name="unmute" />
              <span className="desktop-only">Live</span>
            </Menu.Item>
          </Menu.Menu>
        </Menu>




        <Container className="main">
          <Sidebar.Pushable>
            <Sidebar.Pusher
              onClick={this.handlePusherClick}
              style={{ minHeight: '100vh' }}
            >
              <Visibility onTopVisible={this.loadNewerCalls} onBottomVisible={this.loadOlderCalls} once={false}>
                <ListCalls callsAllIds={this.props.callsAllIds} currentCallRef={this.currentCallRef} callsById={this.props.callsById} activeCallId={this.state.callId} talkgroups={this.props.talkgroups} playCall={this.playCall} />
              </Visibility>
            </Sidebar.Pusher>
          </Sidebar.Pushable>
          <Rail position='right' className="desktop-only" dimmed={sidebarOpened ? "true" : "false"} >
            <Sticky context={contextRef} offset={60}>
              <CallInfo call={currentCall} header={callInfoHeader} link={callLink}/>
            </Sticky>
          </Rail>
        </Container>

        <Menu fixed="bottom" compact inverted >
          <Menu.Item active={this.state.autoPlay} onClick={() => this.switchAutoPlay()}><Icon name="level up" /><span className="desktop-only">Autoplay</span></Menu.Item>
          <MediaPlayer ref={this.audioRef} call={currentCall} onEnded={this.callEnded} onPlayPause={this.handlePlayPause} />
          <Menu.Menu position="right" className="desktop-only">
            <Menu.Item onClick={this.handleSupportToggle}><Icon name="coffee" />Support OpenMHz</Menu.Item>
            <Menu.Item><a href={callDownload}><Icon name="download" />Download</a></Menu.Item>
            <Menu.Item><a href={callLink}><Icon name="at" />Link</a></Menu.Item>
          </Menu.Menu>
        </Menu>

      </div>





    );
  }
}

export default CallPlayer;
