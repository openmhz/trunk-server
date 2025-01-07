import React, { useMemo, useEffect } from "react";
import { useCallLink } from "./CallLinks";
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetSystemsQuery, useGetTalkgroupsQuery } from '../../features/api/apiSlice'
import {  useParams } from 'react-router-dom';
import {
  Header,
  Divider,
  List,
  Statistic,
  Icon,
  Menu
} from "semantic-ui-react";

// ----------------------------------------------------
function CallInfoPane(props) {


  let srcList = "";
  let callLength = "-";
  let callFreq = "-";
  let callDate = "-";
  let callTime = "-";
  let talkgroupNum = "-";
  let patches = [];
  let patchString = "";
  let header = "Call Info"
  let title = ""
  const currentCall = props.call ? props.call : false;
  const { callLink, callDownload, callTweet } = useCallLink(props.call)
  const { data: allSystems, isSuccess } = useGetSystemsQuery();
  let { shortName } = useParams();
  if (!shortName && currentCall) {
    shortName = currentCall.shortName;
  }

  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName ? shortName : skipToken);

  if (currentCall) {
    if ((talkgroupsData) && talkgroupsData.talkgroups[currentCall.talkgroupNum]) {
      header = talkgroupsData.talkgroups[currentCall.talkgroupNum].description;
      title = talkgroupsData.talkgroups[currentCall.talkgroupNum].description;
    } else {
      title = `TG: ${currentCall.talkgroupNum}`;
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
    patches = currentCall.patches;
    
    if(patches && (patches.length > 1)) {
      patchString = patches.join(", ");
    }
    else{
      patchString = "No Patches";
    }

  }
  let system = false;
  if (allSystems) {
    system =  allSystems.systems.find((system) => system.shortName === shortName)
  } 

/*
  let system = useMemo(() => {
    if (allSystems) {
      return allSystems.systems.find((system) => system.shortName === currentCall.shortName)
    } else {
      return false;
    }
  }, [allSystems, currentCall.shortName])*/

  useEffect(() => {
    // When audio starts playing...
    if ('mediaSession' in navigator) {

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        album: 'OpenMHz',
        artist: system ? system.name : "",
        artwork: [
          { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }
  }, [currentCall])




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
        <List.Item>
          <Icon name="exchange" />
          <List.Content>
            {patchString}
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
