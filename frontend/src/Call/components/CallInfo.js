import React, { useState } from "react";
import { useCallLink } from "./CallLinks";
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
import CallInfoPane from "./CallInfoPane"
// ----------------------------------------------------
function CallInfo(props) {
  const { shortName } = useParams();
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);

  let srcList = "";
  let callLength = "-";
  let callFreq = "-";
  let callDate = "-";
  let callTime = "-";
  let talkgroupNum = "-";
  let header = "Call Info"

  if (props.call) {
    const currentCall = props.call;
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
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (e, data) => setActiveTab(data.activeIndex);

  const panes = [
    {
      menuItem: { key: 'info', icon: 'info', content: 'Call Info' }, render: () => {
        return (

            <Tab.Pane attached='bottom'>
                <CallInfoPane call={props.call} />
            </Tab.Pane>

        )
      }
    },
    {
      menuItem: { key: 'list', icon: 'list', content: 'Create Event' }, render: () => {
        return (
          <PlaylistBuilder />
        )
      }
    }
  ]


  return (
    <div>
      <Tab menu={{ attached: 'top', fluid: true, widths: 2 }} panes={panes} defaultActiveIndex={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default CallInfo;
