import React, { useLayoutEffect } from "react";
import { useParams } from 'react-router-dom';
import CallItem from "./CallItem";
import {
  Icon,
  Table
} from "semantic-ui-react";
import "../CallPlayer.css";
import { useGetTalkgroupsQuery } from '../../features/api/apiSlice'
import { useSelector } from 'react-redux'


// ----------------------------------------------------
const ListCalls = (props) => {
  const activeCallId = props.activeCallId;
  const { shortName } = useParams();
  const centerCall = useSelector((state) => state.callPlayer.centerCall);
  const { data: talkgroupsData } = useGetTalkgroupsQuery(shortName);
  const buildingPlaylist = useSelector((state) => state.callPlayer.buildingPlaylist);

  useLayoutEffect(() => {
    if (!centerCall || !activeCallId) return;
    // rows carry data-callid, so no per-row ref wrapper is needed
    const rows = document.querySelectorAll('#calls tr[data-callid]');
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].dataset.callid === activeCallId) {
        rows[i].scrollIntoView({ block: "center" });
        break;
      }
    }
  }, [activeCallId]);

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
          {buildingPlaylist && <Table.HeaderCell><Icon name='list ul' /></Table.HeaderCell>}
        </Table.Row>
      </Table.Header>
      {callsData &&
        <Table.Body>
          {
            callsData.ids.map((callId) => (
              <CallItem key={callId} callId={callId} activeCall={callId === activeCallId} talkgroups={talkgroupsData} onClick={props.playCall} />
            ))
          }
        </Table.Body>
      }
    </Table>

  );

}

export default ListCalls;
