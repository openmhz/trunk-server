import React, { useState, useEffect } from "react";
import {
  Table,
  Icon,
  Label,
  FormField,
  Checkbox
} from "semantic-ui-react";


import { addStar, removeStar } from "../../features/calls/callsSlice";
import { addToPlaylist, removeFromPlaylist } from '../../features/callPlayer/callPlayerSlice';
import { useDispatch, useSelector } from 'react-redux'

const CallItem = (props) => {
  const call = props.call;
  const buildingPlaylist = useSelector((state) => state.callPlayer.buildingPlaylist);

  const playlist = useSelector((state) => state.callPlayer.playlist);
  const shortName = props.shortName;
  const talkgroups = props.talkgroups;
  const activeCall = props.activeCall;
  const [starVisible, setStarVisible] = useState(false);
  const [starClicked, setStarClicked] = useState(false);
  const [inPlaylist, setInPlaylist] = useState(false);

  const dispatch = useDispatch();

  const time = new Date(call.time);

  useEffect(() => {
    if (playlist.find((item) => item._id == call._id)) {
      setInPlaylist(true);
    } else {
      setInPlaylist(false);
    }
  }, [playlist]);

  const handleStarClicked = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (!starClicked) {
      setStarClicked(true);
      dispatch(addStar(props.call._id));
    } else {
      setStarClicked(false);
      dispatch(removeStar(props.call._id));
    }
  }

  let rowSelected = {};
  let starButton;
  let starClickable = {};

  const onDragStart = (event) => {
    // It receives a DragEvent
    // which inherits properties from
    // MouseEvent and Event
    // so we can access the element
    // through event.currentTarget
  
    // Later, we'll save
    // in a hook variable
    // the item being dragged
    const callId = event.currentTarget.dataset.callid;
    event.dataTransfer.setData("call-id", callId);
    console.log("Dragging: " + callId);

  }

  const handlePlaylist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inPlaylist) {
      dispatch(removeFromPlaylist(call));
    } else {
      dispatch(addToPlaylist(call));
    }
  }

  if (!starClicked) {
    starClickable = { link: true };
  }
  if (!call.star && starVisible) {
    starButton = <Icon name='star outline' />
  }

  if (call.star) {
    starButton = <Icon name='star' />
  }
  if (call.star && call.star > 1) {
    starButton = (<Icon.Group >
      <Icon {...starClickable} name='star' />
      <Label circular color='red' size='mini' floating>
        {call.star}
      </Label>
    </Icon.Group>)
  }

  if (activeCall) {
    rowSelected = {
      positive: true,
      color: "blue",
      key: "blue",
      inverted: "true"
    }
  }
  let talkgroup;
  if ((typeof talkgroups== 'undefined') || (typeof talkgroups.talkgroups[call.talkgroupNum] == 'undefined')) {
    talkgroup = call.talkgroupNum;
  } else {
    talkgroup = talkgroups.talkgroups[call.talkgroupNum].description;
  }

  const cirlceStyle = {width:"4px",
              margin:"6px",
              height: "4px",
              borderRadius:"50%",
              background: "#09f"}

  let playStatus = (<></>)
  if (activeCall) {
    playStatus = (<Icon name="play"  size='small' color="green"/>)
    
  } else if (!call.played) {
    playStatus = (<div style={cirlceStyle}/>)
  } 

  return (
    <Table.Row draggable="true" onClick={(e) => props.onClick({ call: call }, e)} {...rowSelected} onDragStart={onDragStart} data-callid={call._id}>
      <Table.Cell>{playStatus}</Table.Cell>
      <Table.Cell>{call.len}</Table.Cell>
      <Table.Cell>{talkgroup}</Table.Cell>
      <Table.Cell>{`${time.toLocaleTimeString()} ${time.toLocaleDateString() !== new Date().toLocaleDateString() ? time.getMonth() + 1 + '/' + time.getDate() : ''}`}</Table.Cell> 
      <Table.Cell onMouseEnter={() => setStarVisible(true)} onMouseLeave={() => setStarVisible(false)} onClick={handleStarClicked}>{starButton}</Table.Cell>
      {buildingPlaylist && <Table.Cell>    <FormField>
      <Checkbox checked={inPlaylist} onChange={handlePlaylist} />
    </FormField></Table.Cell>}
    </Table.Row>
  );
}

export default CallItem;
