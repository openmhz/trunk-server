import React, { useMemo, useEffect, useRef } from "react";
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetSystemsQuery, useGetTalkgroupsQuery } from '../../features/api/apiSlice'
import { useDispatch, useSelector } from 'react-redux'
import {  useParams } from 'react-router-dom';
import {
  Header,
  Divider,
  List,
  Statistic,
  Icon,
  Segment,
  Loader
} from "semantic-ui-react";
import { fetchCall } from "../../features/calls/callsSlice";
import { selectIsSupporter } from "../../features/user/userSlice";

// Conventional ham systems have no real talkgroups, so the talkgroup number is
// used to carry the repeater frequency in kHz (145430 -> "145.430 MHz").
// Falls back to the raw value if it is not numeric.
function formatFreq(num) {
  // Number(null) and Number("") are both 0, not NaN, so those have to be
  // rejected explicitly or they render as a bogus "0.000 MHz".
  if (num === null || num === undefined || num === "") return num;
  const kHz = Number(num);
  return Number.isFinite(kHz) ? `${(kHz / 1000).toFixed(3)} MHz` : num;
}

/**
 * The transcript, or an honest account of why there isn't one.
 *
 * The state comes from the server, which is also the only thing that decides
 * whether the text is in the payload at all - a free account never receives it,
 * rather than receiving it and having it hidden here.
 *
 *   ready   the text
 *   pending being transcribed right now
 *   locked  there is one, but this account is not a Supporter
 *   none    there is nothing to show, for anybody. Render nothing at all -
 *           most short overs are silence, and an explanation on every one of
 *           them would be noise.
 */
function TranscriptPane({ call, isSupporter }) {
  if (!call) return null;
  const state = call.transcriptState;

  if (state === 'ready' && call.transcript) {
    return (
      <>
        <Divider />
        <Header as="h4" style={{ marginBottom: '0.5em' }}>
          <Icon name="quote left" />Transcript
        </Header>
        <Segment secondary style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {call.transcript}
        </Segment>
        <div style={{ fontSize: '0.85em', color: 'rgba(0,0,0,.5)', marginTop: '-0.5em' }}>
          Machine transcription — may be inaccurate.
        </div>
      </>
    );
  }

  if (state === 'pending' && isSupporter) {
    return (
      <>
        <Divider />
        <Header as="h4"><Icon name="quote left" />Transcript</Header>
        <Segment secondary>
          <Loader active inline size="mini" /> <span style={{ marginLeft: '0.5em' }}>Transcribing…</span>
        </Segment>
      </>
    );
  }

  if (state === 'locked') {
    return (
      <>
        <Divider />
        <Segment secondary textAlign="center">
          <Icon name="lock" />
          Transcripts are a Supporter feature.
          <div style={{ marginTop: '0.5em' }}>
            <a href={`${process.env.REACT_APP_ACCOUNT_SERVER}/profile`}>Become a Supporter</a>
          </div>
        </Segment>
      </>
    );
  }

  return null;
}

// ----------------------------------------------------
function CallInfoPane(props) {


  let srcList = "";
  let callLength = "-";
  let callFreq = "-";
  let callDate = "-";
  let callTime = "-";
  let patchString = "";
  let header = "Call Info"
  let title = ""
  const currentCall = props.call ? props.call : false;
  const dispatch = useDispatch();
  const isSupporter = useSelector(selectIsSupporter);
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
      title = formatFreq(currentCall.talkgroupNum);
    }
    const time = new Date(currentCall.time);
    callTime = time.toLocaleTimeString();
    callDate = time.toLocaleDateString();
    if (currentCall.freq) {
      const freq = currentCall.freq / 1000000;
      callFreq = Math.round(freq * 1000) / 1000;
    }
    // src is the radio ID of the unit that keyed up and pos is how far into the
    // recording they started. Only trunked systems carry a unit ID; a
    // conventional repeater has none, so trunk-recorder writes src "-1" at
    // position 0 and the pane filled up with "-1[0]" for every call. Show only
    // real units, so this still works if a trunked system is ever added.
    const realSources = (currentCall.srcList || []).filter(source => Number(source.src) > 0);
    srcList = realSources.map((source, index) => <List.Item key={index}>{source.src}[{source.pos}]</List.Item>);
    callLength = currentCall.len;

    // Patches are talkgroups a trunked dispatcher has tied together. Nothing
    // patches a repeater, and trunk-recorder sends [null], so the row only said
    // "No Patches" forever. The old test was length > 1, which also hid a
    // single genuine patch.
    const realPatches = (currentCall.patches || []).filter(Boolean);
    patchString = realPatches.length > 0 ? realPatches.join(", ") : "";

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

  // A call arrives over the socket before it has been transcribed, so poll for
  // the one being looked at until the transcript lands. Bounded: six tries at
  // three seconds. Transcription takes five or six seconds in practice, and a
  // call that has not produced one by twenty is one that never will - noise, or
  // a failure - so there is nothing to wait for.
  const transcriptState = currentCall ? currentCall.transcriptState : null;
  const pollsRef = useRef(0);

  useEffect(() => {
    pollsRef.current = 0;
  }, [currentCall && currentCall._id]);

  useEffect(() => {
    if (!currentCall || !isSupporter || transcriptState !== 'pending') return;
    if (pollsRef.current >= 6) return;

    const timer = setTimeout(() => {
      pollsRef.current += 1;
      dispatch(fetchCall({ shortName: currentCall.shortName || shortName, callId: currentCall._id }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [dispatch, isSupporter, transcriptState, currentCall && currentCall._id, shortName]);

  useEffect(() => {
    // When audio starts playing...
    if ('mediaSession' in navigator) {

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        album: process.env.REACT_APP_SITE_NAME,
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
      {srcList.length > 0 &&
        <List bulleted horizontal link>
          {srcList}
        </List>}
      <Divider />
      <Statistic size='small'>
        <Statistic.Label>Seconds</Statistic.Label>
        <Statistic.Value>{callLength}</Statistic.Value>
      </Statistic>
      {/* The frequency used to be repeated here as a large statistic, derived
          from the talkgroup number. It is the same number as the MHz line
          below, so only the line below remains. */}
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
        {patchString &&
          <List.Item>
            <Icon name="exchange" />
            <List.Content>
              {patchString}
            </List.Content>
          </List.Item>}
      </List>
      {/* Download lived here too. The player already has one next to the
          waveform, so this was the same control twice on the same screen. */}

      <TranscriptPane call={currentCall} isSupporter={isSupporter} />
    </>
  );
}

export default CallInfoPane;
