import {
    Card,
    Header
} from "semantic-ui-react";
import { useNavigate } from 'react-router-dom'
import SystemCard from "./SystemCard";


const InternationList = (other) => {
    
    const navigate = useNavigate();
    let international = [];
    international.push((<Header as="h2" id="international">International</Header>))
    international.push((
        <Card.Group itemsPerRow={4} stackable={true}>
            {other &&
                other.map((system) => {
                    return <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)} />
                })}
        </Card.Group>
    ))
    return international;
}

export default InternationList;