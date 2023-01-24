import React, { useState } from "react";
import {
  Table,
  Icon,
  Label
} from "semantic-ui-react";

import { useGetTalkgroupsQuery } from '../features/api/apiSlice'


const EventCallItem = (props) => {
  const call = props.call;
  const activeCall = props.activeCall;
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(call.shortName);


  const time = new Date(call.time);



  let rowSelected = {};






  if (activeCall) {
    rowSelected = {
      positive: true,
      color: "blue",
      key: "blue",
      inverted: "true"
    }
  }
  let talkgroup;
  if ((typeof talkgroupsData == 'undefined') || (typeof talkgroupsData.talkgroups[call.talkgroupNum] == 'undefined')) {
    talkgroup = call.talkgroupNum;
  } else {
    talkgroup = talkgroupsData.talkgroups[call.talkgroupNum].description;
  }
  return (
    <Table.Row  onClick={(e) => props.onClick({ call: call }, e)} {...rowSelected}>
      <Table.Cell>  {call.len} </Table.Cell>
      <Table.Cell> {talkgroup} </Table.Cell>
      <Table.Cell> {time.toLocaleTimeString()} </Table.Cell>
      <Table.Cell> {call.shortName}</Table.Cell>
    </Table.Row>
  );
}

export default EventCallItem;
