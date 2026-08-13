import React from "react";
import { Segment } from "semantic-ui-react";
import CallInfoPane from "./CallInfoPane"

// ----------------------------------------------------
// Was a two-tab layout ("Call Info" / "Create Event"). With the Events feature
// removed there is only one pane left, so the tab chrome is gone and the info
// pane renders directly. CallInfoPane fetches its own talkgroup data.
function CallInfo(props) {
  return (
    <Segment attached='top'>
      <CallInfoPane call={props.call} />
    </Segment>
  );
}

export default CallInfo;
