import React from "react";
import {Link} from 'react-router-dom';
import CallItem from "./CallItem";
import {
  Container,
  Label,
  Rail,
  Sticky,
  Menu,
  Icon,
  Table,
  Sidebar
} from "semantic-ui-react";
import "./CallPlayer.css";







// ----------------------------------------------------
class ListCalls extends React.Component {

  constructor(props) {
    super(props);

    // Ref for auto-scrolling
    this.headerRef = React.createRef();
    this.windowPos = 0;
  }

  componentDidMount() {
    if (this.windowPos === 0) {
      // If the user hasn't scrolled down intentionally, scroll up to the top of the page
      this.headerRef.current.scrollTo(0, 0);
    }
  }

  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    // Capture window position
    this.windowPos = window.scrollY;
   
    return (

        <Table id="calls" unstackable>
          <Table.Header ref={this.headerRef}>
            <Table.Row>
              <Table.HeaderCell>Len</Table.HeaderCell>
              <Table.HeaderCell>Talkgroup</Table.HeaderCell>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell><Icon name='star' /></Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>

            {this.props.callsAllIds.map((callId, index) => <CallItem activeCall={callId == this.props.activeCallId ? true : false} call={this.props.callsById[callId]} talkgroups={this.props.talkgroups} key={index} onClick={this.props.playCall}/>)}

          </Table.Body>
        </Table>


  );
  }
}

export default ListCalls;
