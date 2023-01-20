import { useSelector, useDispatch } from 'react-redux'
import React, { useState } from "react";
import {
  Header,
  Divider,
  List,
  ListItem,
  Segment,
  Statistic,
  Icon,
  Menu,
  Tab
} from "semantic-ui-react";

function PlaylistBuilder(props) {

  const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);
  const [playlist, setPlaylist] = useState([]);

  const onDragOver = (event) => {
    // It also receives a DragEvent.
    // Later, we'll read the position
    // of the item from event.currentTarget
    // and store the updated list state

    // We need to prevent the default behavior
    // of this event, in order for the onDrop
    // event to fire.
    // It may sound weird, but the default is
    // to cancel out the drop.

    event.preventDefault();
  }

  const onDrop = (event) => {
    // Here, we will:
    // - update the rendered list
    // - and reset the DnD state
    var callId = event.dataTransfer.getData("call-id");
    console.log("Dropping: " + callId);
    console.log("Found: " + callsData.entities[callId].freq);
    setPlaylist([...playlist, callId]);
  }
  let listItems = "";

    listItems = playlist.map((callId, index) => {
      const call = callsData.entities[callId];
      return(<li><Icon name="wait" />{call.time}</li>)
    })
  

  return (
    <Tab.Pane attached='bottom' onDragOver={onDragOver} onDrop={onDrop}>
      <ul>
        {listItems}
        <li>test</li>
      </ul>
    </Tab.Pane>
  )
}

export default PlaylistBuilder;