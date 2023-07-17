import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import CallItem from "./CallItem";
import {
  Icon,
  Table,
  Ref
} from "semantic-ui-react";
import "../CallPlayer.css";
import { useGetTalkgroupsQuery } from '../../features/api/apiSlice'
import { useSelector } from 'react-redux'

// ----------------------------------------------------
const ListCalls = (props) => {
    const activeCallRef  = useRef();
    const activeCallId = props.activeCallId;
    const { shortName } = useParams();
    const centerCall = useSelector((state) => state.callPlayer.centerCall);
    const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter


  
  useLayoutEffect(() => {
      if (activeCallRef.current && centerCall) {
        activeCallRef.current.scrollIntoView({
          block: "center",
        });
    }
  },[activeCallId, activeCallRef.current]);

    const callsData = props.callsData;
    return (

        <Table id="calls" unstackable  >
          <Table.Header >
            <Table.Row>
            <Table.HeaderCell> </Table.HeaderCell>
              <Table.HeaderCell>Len</Table.HeaderCell>
              <Table.HeaderCell>Talkgroup</Table.HeaderCell>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell><Icon name='star' /></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          {callsData && 
          <Table.Body>
            
            {
              props.callsData.ids.map((callId, index) => {
              if (callId === activeCallId) {
                return (<Ref innerRef={activeCallRef} key={index} ><CallItem activeCall={true}  call={props.callsData.entities[callId]} talkgroups={talkgroupsData} key={index} onClick={props.playCall}/></Ref>)
              } else {
                return <CallItem activeCall={false} call={props.callsData.entities[callId]} talkgroups={talkgroupsData} key={index} onClick={props.playCall}/>
              }
            })
           
          }

          </Table.Body>
        }
        </Table>
        

  );
  
}

export default ListCalls;
