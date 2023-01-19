import { useSelector, useDispatch } from 'react-redux'

import {
    Header,
    Divider,
    List,
    Segment,
    Statistic,
    Icon,
    Menu,
    Tab
  } from "semantic-ui-react";

  function PlaylistBuilder(props) {

    const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);

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
      }

      return (
        <Tab.Pane attached='bottom'>
        <div onDragOver={onDragOver} onDrop={onDrop}>Placeholder</div>
      </Tab.Pane>
      )
  }

  export default PlaylistBuilder;