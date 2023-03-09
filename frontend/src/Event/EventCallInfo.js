import React, { useState } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
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
import CallInfoPane from "../Call/components/CallInfoPane"
// ----------------------------------------------------
function EventCallInfo(props) {
  return (
    <Segment>
        <CallInfoPane call={props.call} />
    </Segment>
   
  );
}

export default EventCallInfo;
