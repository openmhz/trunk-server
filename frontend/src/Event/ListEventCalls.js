import React, { useEffect, useRef } from "react";
import CallItem from "../Call/components/CallItem";
import {
  Icon,
  Table,
  Ref
} from "semantic-ui-react";
import "../Call/CallPlayer.css";

// ----------------------------------------------------
const ListEventCalls = (props) => {
    const activeCallRef  = useRef();

  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter

    useEffect(() => {
      if (activeCallRef.current) {
        activeCallRef.current.scrollIntoView({
          block: "center",
        });
    }
  });


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
          {props.eventData && 
          <Table.Body>
            
            { props.eventData.calls.map((call, index) => {
              if (call._id === props.activeCallId) {
                return (<Ref innerRef={activeCallRef} key={index} ><CallItem activeCall={true}  call={call} key={index} onClick={props.playCall}/></Ref>)
              } else {
                return <CallItem activeCall={false} call={call} key={index} onClick={props.playCall}/>
              }
            })
           
          }

          </Table.Body>
        }
        </Table>
        

  );
  
}

export default ListEventCalls;
