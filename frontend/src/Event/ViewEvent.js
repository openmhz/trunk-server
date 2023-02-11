import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import EventPlayer from "./EventPlayer";
import { useSelector, useDispatch } from 'react-redux'
import { useGetEventQuery } from '../features/api/apiSlice'
import queryString from '../query-string';
import {
  Container,
  Label,
  Menu,
  Icon,
  Sidebar,
  Grid,
  Statistic,
  Header

} from "semantic-ui-react";
import "../Call/CallPlayer.css";







// ----------------------------------------------------
function ViewEvent(props) {

  const { id } = useParams();

  const { data: eventData, isSuccess: isEventSuccess } = useGetEventQuery(id);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentCall, setCurrentCall] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [selectCallId, setSelectCallId] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();



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


  const setStateFromUri = async () => {

    // is this just for one call?
    if (uri.hasOwnProperty('call-id')) {
      const _id = uri['call-id'];
      setSelectCallId(_id);
    }
  }

  const dateRange = (start, end) => {
    if (start.getYear() != end.getYear()) {
      return { "part1": start.toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
    } else if (start.getMonth() != end.getMonth()) {
      return { "part1": start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };

    } else if (start.getDay() != end.getDay()) {
      return { "part1": start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleDateString('en-us', { weekday: "short", day: "numeric" }) + " " + end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };

    } else {
      return { "part1": start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };

    }
  }
  let dates = { part1: "", part2: "" }
  let expirationDate = ""
  let downloadUrl = false
  if (eventData) {
    downloadUrl = eventData.downloadUrl;
    dates = dateRange(new Date(eventData.startTime), new Date(eventData.endTime))
    expirationDate = new Date(eventData.expireTime).toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" })
  }

  /*
    const dateRange = (start, end) => {
      if (start.getYear() != end.getYear()) {
          return start.toLocaleDateString('en-us', { weekday:"short", year:"numeric", month:"short", day:"numeric"}) + " " + start.toLocaleTimeString() + " - " + end.toLocaleDateString('en-us', { weekday:"short", year:"numeric", month:"short", day:"numeric"}) + " " + end.toLocaleTimeString(); 
      } else if (start.getMonth() != end.getMonth()) {
          return start.toLocaleDateString('en-us', { weekday:"short",  month:"short", day:"numeric"}) + " " + start.toLocaleTimeString() + " - " + end.toLocaleDateString('en-us', { weekday:"short", month:"short", day:"numeric"}) + " " + end.toLocaleTimeString(); 
      
      } else if (start.getDay() != end.getDay()) {
          return start.toLocaleDateString('en-us', { weekday:"short",  month:"short", day:"numeric"}) + " " + start.toLocaleTimeString() + " - " + end.toLocaleDateString('en-us', { weekday:"short", day:"numeric"}) + " " + end.toLocaleTimeString(); 
      
      } else {
          return start.toLocaleDateString('en-us', { weekday:"short",  month:"short", day:"numeric"}) + " " + start.toLocaleTimeString() + " - " + end.toLocaleTimeString(); 
      
      }
    }
    let dates = "";
    if (eventData) {
      dates = dateRange(new Date(eventData.startTime),new Date(eventData.endTime));
     }*/
  return (
    <div >
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
        <Container className="desktop-only" fluid textAlign='left' style={{ fontSize: '1.5rem', paddingLeft: '0.5em', paddingTop: '.5em' }}>
          {eventData && eventData.title}
        </Container>
      </Menu>
      <Grid style={{ paddingTop: '4em' }}>
        <Grid.Column mobile={1} tablet={1} computer={1} ></Grid.Column>
        <Grid.Column mobile={16} tablet={8} computer={4}>

          {eventData &&
            <>
              <p>{eventData.description}</p>
              <Header size='tiny'>Expires {expirationDate}</Header>
            </>
          }

        </Grid.Column>
        <Grid.Column mobile={8} tablet={8} computer={3}>
          <Header as="h2">{dates.part1} <br />→ {dates.part2}</Header>
        </Grid.Column>
        <Grid.Column mobile={8} tablet={8} computer={2}>

          <Statistic>
            <Statistic.Value>{eventData && eventData.numCalls}</Statistic.Value>
            <Statistic.Label>Calls</Statistic.Label>
          </Statistic>
        </Grid.Column>

        <Grid.Column mobile={1} tablet={1} computer={2}>
          {downloadUrl &&
            <a href={downloadUrl}>
              <Statistic small className="desktop-only">
                <Statistic.Value><Icon name="download" /></Statistic.Value>
                <Statistic.Label>Download Event</Statistic.Label>
              </Statistic>
            </a>
          }
        </Grid.Column>
        <Grid.Column mobile={1} tablet={1} computer={4}>
        </Grid.Column>
      </Grid>
      {eventData && <EventPlayer eventData={eventData} selectCallId={selectCallId} />}
    </div>
  );
}


export default ViewEvent;
