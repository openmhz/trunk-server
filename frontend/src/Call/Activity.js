import React, { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import FilterModal from "./components/FilterModal";
import GroupModal from "./components/GroupModal";
import CalendarModal from "./components/CalendarModal";
import CallPlayer from "./CallPlayer";

import { useSelector, useDispatch } from 'react-redux'
import { setFilter, setDateFilter } from "../features/callPlayer/callPlayerSlice";

import { useGetStatsQuery,useGetTalkgroupsQuery } from '../features/api/apiSlice'
import ActivityChart from "./BetterActivityChart";
import { selectSystem } from "../features/systems/systemsSlice";
import {
    Container,
    Label,
    Rail,
    Sticky,
    Menu,
    Icon,
    Sidebar,
    Header

} from "semantic-ui-react";
import "./CallPlayer.css";
import queryString from '../query-string';
import io from 'socket.io-client';
import { useCallLink } from "./components/CallLinks";


function Activity(props) {
    const { shortName } = useParams();
    const { data: statsData, isSuccess: isStatsSuccess } = useGetStatsQuery(shortName);
    const { data: talkgroupData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);

    const talkgroupStats = useMemo(() => { 
        if (statsData ) {
            const result =[]
            for (const tgNum in statsData.talkgroupStats) {
                let tg = tgNum;
                if (talkgroupData && talkgroupData.talkgroups[tgNum] !== undefined) {
                    tg = talkgroupData.talkgroups[tgNum].description;
                }
                result.push(<ActivityChart key={tgNum} tg={tg} tgNum={tgNum}  data={statsData.talkgroupStats[tgNum].callCountHistory}  navigate={props.navigate}/>);
            }
            return result;
        } else {
            return [];
        }


    }, [statsData, talkgroupData]);


    return (
        <Container style={{  marginTop: "65px"}}>
            <Header as="h2">Talkgroup Activity</Header>
            {
                talkgroupStats.map( chart => {
                   return chart
                }) 
            }

        </Container>
    )

}

export default Activity;