import React, { useEffect, useRef } from "react";
import EventCallItem from "./EventCallItem";
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
            <Table.HeaderCell> </Table.HeaderCell>
              <Table.HeaderCell>Len</Table.HeaderCell>
              <Table.HeaderCell>Talkgroup</Table.HeaderCell>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell>System</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          {props.eventData && 
          <Table.Body>
            
            { props.eventData.calls.map((call, index) => {
              if (call._id === props.activeCallId) {
                return (<Ref innerRef={activeCallRef} key={index} ><EventCallItem activeCall={true}  call={call} key={index} onClick={props.playCall} showStar={false}/></Ref>)
              } else {
                return <EventCallItem activeCall={false} call={call} key={index} onClick={props.playCall} showStar={false}/>
              }
            })
           
          }

          </Table.Body>
        }
        </Table>
        

  );
  
}

export default ListEventCalls;
