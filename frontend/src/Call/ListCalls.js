import React from "react";
import CallItem from "./CallItem";
import {
  Icon,
  Table,
  Ref
} from "semantic-ui-react";
import "./CallPlayer.css";

// ----------------------------------------------------
class ListCalls extends React.Component {

  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const callsData = this.props.callsData;
    return (

        <Table id="calls" unstackable  >
          <Table.Header >
            <Table.Row>
              <Table.HeaderCell>Len</Table.HeaderCell>
              <Table.HeaderCell>Talkgroup</Table.HeaderCell>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell><Icon name='star' /></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          {callsData != false && 
          <Table.Body>
            
            {
              this.props.callsData.ids.map((callId, index) => {
              if (callId === this.props.activeCallId) {
                return (<Ref innerRef={this.props.currentCallRef} key={index} ><CallItem activeCall={true}  call={this.props.callsData.entities[callId]} talkgroups={this.props.talkgroups} key={index} onClick={this.props.playCall}/></Ref>)
              } else {
                return <CallItem activeCall={false} call={this.props.callsData.entities[callId]} talkgroups={this.props.talkgroups} key={index} onClick={this.props.playCall}/>
              }
            })
           
          }

          </Table.Body>
        }
        </Table>
        

  );
  }
}

export default ListCalls;
