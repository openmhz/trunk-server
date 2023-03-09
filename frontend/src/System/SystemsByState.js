import {
    Card,
    Header
} from "semantic-ui-react";
import { useNavigate } from 'react-router-dom'
import SystemCard from "./SystemCard";


const SystemsByState = (states) => {
    const navigate = useNavigate();
    let systemsByState = [];

    if (states) {

        let keys = Object.keys(states);
        keys.sort();

        for (var i = 0; i < keys.length; ++i) {
            const state = keys[i];

            systemsByState.push((<Header key={"header-" +state} as="h2" id={state}>{state}</Header>))
            systemsByState.push((
                <Card.Group  key={"group-" +state} itemsPerRow={4} stackable={true}>
                    {states[state] &&
                        states[state].map((system) => {
                            return <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)} />
                        })}
                </Card.Group>
            ))
        }
    }
    return systemsByState;
}

export default SystemsByState;