import React, {  useMemo } from "react";
import {  useParams } from 'react-router-dom';


import { useGetStatsQuery,useGetTalkgroupsQuery } from '../features/api/apiSlice'
import ActivityChart from "./BetterActivityChart";
import {
    Container,
    Header

} from "semantic-ui-react";
import "./CallPlayer.css";



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