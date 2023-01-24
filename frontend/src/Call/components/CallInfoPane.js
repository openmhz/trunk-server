import React, { useState } from "react";
import { useCallLink } from "./CallLinks";
import {skipToken} from '@reduxjs/toolkit/query'
import { useGetGroupsQuery, useGetTalkgroupsQuery } from '../../features/api/apiSlice'
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
import PlaylistBuilder from "./PlaylistBuilder"
// ----------------------------------------------------
function CallInfoPane(props) {


  let srcList = "";
  let callLength = "-";
  let callFreq = "-";
  let callDate = "-";
  let callTime = "-";
  let talkgroupNum = "-";
  let header = "Call Info"
  const currentCall = props.call?props.call:false;



    const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(currentCall?currentCall.shortName:skipToken);
   
   if (currentCall) {
    if ((talkgroupsData) && talkgroupsData.talkgroups[currentCall.talkgroupNum]) {
      header = talkgroupsData.talkgroups[currentCall.talkgroupNum].description;
    }
    const time = new Date(currentCall.time);
    callTime = time.toLocaleTimeString();
    callDate = time.toLocaleDateString();
    if (currentCall.freq) {
      const freq = currentCall.freq / 1000000;
      callFreq = Math.round(freq * 1000) / 1000;
    }
    srcList = currentCall.srcList.map((source, index) => <List.Item key={index}>{source.src}[{source.pos}]</List.Item>);
    callLength = currentCall.len;
    talkgroupNum = currentCall.talkgroupNum;

  }
  const { callLink, callDownload, callTweet } = useCallLink(props.call)


  return (
    <>
    <Header as='h1'>{header}</Header>
    <List bulleted horizontal link>
      {srcList}
    </List>
    <Divider />
    <Statistic size='small'>
      <Statistic.Label>Seconds</Statistic.Label>
      <Statistic.Value>{callLength}</Statistic.Value>
    </Statistic>
    <Statistic size='small'>
      <Statistic.Label>Talkgroup</Statistic.Label>
      <Statistic.Value>{talkgroupNum}</Statistic.Value>
    </Statistic>

    <List divided verticalAlign='middle'>
      <List.Item>
        <Icon name="wait" />
        <List.Content>
          {callTime}
        </List.Content>
      </List.Item>
      <List.Item>
        <Icon name="calendar outline" />
        <List.Content>
          {callDate}
        </List.Content>
      </List.Item>
      <List.Item>
        <Icon name="cubes" />
        <List.Content>
          {callFreq} MHz
        </List.Content>
      </List.Item>
    </List>
    <Divider />
  <Menu secondary fluid widths={2}>
    <Menu.Item name="download" href={callDownload}><Icon name="download" />Download</Menu.Item>
    <Menu.Item name="link" href={callLink}><Icon name="at" />Link</Menu.Item>
  </Menu>
  </>
  );
}

export default CallInfoPane;
