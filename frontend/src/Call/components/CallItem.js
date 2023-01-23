import React, { useState } from "react";
import {
  Table,
  Icon,
  Label
} from "semantic-ui-react";


import { addStar, removeStar } from "../../features/calls/callsSlice";
import { useGetTalkgroupsQuery } from '../../features/api/apiSlice'
import { useDispatch } from 'react-redux'

const CallItem = (props) => {
  const call = props.call;
  const activeCall = props.activeCall;
  const [starVisible, setStarVisible] = useState(false);
  const [starClicked, setStarClicked] = useState(false);
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(call.shortName);
  const dispatch = useDispatch();

  const time = new Date(call.time);


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
  if ((typeof talkgroupsData == 'undefined') || (typeof talkgroupsData.talkgroups[call.talkgroupNum] == 'undefined')) {
    talkgroup = call.talkgroupNum;
  } else {
    talkgroup = talkgroupsData.talkgroups[call.talkgroupNum].description;
  }
  return (
    <Table.Row draggable="true" onClick={(e) => props.onClick({ call: call }, e)} {...rowSelected} onDragStart={onDragStart} data-callid={call._id}>
      <Table.Cell>  {call.len} </Table.Cell>
      <Table.Cell> {talkgroup} </Table.Cell>
      <Table.Cell> {time.toLocaleTimeString()} </Table.Cell>
      <Table.Cell onMouseEnter={() => setStarVisible(true)} onMouseLeave={() => setStarVisible(false)} onClick={handleStarClicked}>{starButton}</Table.Cell>
    </Table.Row>


  );
}

export default CallItem;
