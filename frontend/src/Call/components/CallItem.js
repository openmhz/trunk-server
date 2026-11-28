import React, { useState } from "react";
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

const circleStyle = {
  width: "4px",
  margin: "6px",
  height: "4px",
  borderRadius: "50%",
  background: "#09f"
}

// A row selects its own call by id, so a new call (or a change to another row)
// does not re-render every row; props are primitives / stable references.
const CallItem = ({ callId, activeCall, talkgroups, onClick }) => {
  const call = useSelector((state) => state.calls.data.entities[callId]);
  const starredByMe = useSelector((state) => !!state.calls.starredByMe[callId]);
  const buildingPlaylist = useSelector((state) => state.callPlayer.buildingPlaylist);
  const inPlaylist = useSelector((state) => state.callPlayer.playlist.some((item) => item._id === callId));
  const [starVisible, setStarVisible] = useState(false);

  const dispatch = useDispatch();

  if (!call) return null; // trimmed away while the row was still mounted

  const time = new Date(call.time);

  const handleStarClicked = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (!starredByMe) {
      dispatch(addStar(callId));
    } else {
      dispatch(removeStar(callId));
    }
  }

  let rowSelected = {};
  let starButton;

  const onDragStart = (event) => {
    const dragged = event.currentTarget.dataset.callid;
    event.dataTransfer.setData("call-id", dragged);
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

  if (!call.star && starVisible) {
    starButton = <Icon name='star outline' />
  }

  if (call.star) {
    starButton = <Icon name='star' color={starredByMe ? 'yellow' : undefined} />
  } else if (starredByMe) {
    starButton = <Icon name='star' color='yellow' />
  }
  if (call.star && call.star > 1) {
    starButton = (<Icon.Group >
      <Icon link={!starredByMe} name='star' color={starredByMe ? 'yellow' : undefined} />
      <Label circular color='red' size='mini' floating>
        {call.star}
      </Label>
    </Icon.Group>)
  }

  if (activeCall) {
    rowSelected = {
      positive: true,
      color: "blue",
      inverted: "true"
    }
  } else if (call.emergency) {
    rowSelected = {
      positive: true,
      error: true,
      color: "red",
      inverted: "true"
    }
  }
  let talkgroup;
  if (!talkgroups || !talkgroups.talkgroups || (typeof talkgroups.talkgroups[call.talkgroupNum] === 'undefined')) {
    talkgroup = call.talkgroupNum;
  } else {
    talkgroup = talkgroups.talkgroups[call.talkgroupNum].description;
  }

  let playStatus = (<></>)
  if (activeCall) {
    playStatus = (<Icon name="play" size='small' color="green" />)
  } else if (call.failed) {
    playStatus = (<Icon name="warning sign" size='small' color="orange" title="This call could not be played" />)
  } else if (!call.played) {
    playStatus = (<div style={circleStyle} />)
  }

  return (
    <Table.Row draggable="true" onClick={(e) => onClick({ call: call }, e)} {...rowSelected} onDragStart={onDragStart} data-callid={call._id}>
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

export default React.memo(CallItem);
