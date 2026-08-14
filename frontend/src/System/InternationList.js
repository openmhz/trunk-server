import {
    Card,
    Header
} from "semantic-ui-react";
import { useNavigate } from 'react-router-dom'
import SystemCard from "./SystemCard";


const InternationList = (other, onContactClick) => {

    // Called as a plain function from ListSystems, so this hook counts toward
    // that component's render and must run unconditionally - bail out after it,
    // never before.
    const navigate = useNavigate();

    // Systems land here when they have no `state` field, not because they are
    // actually international. The header used to render even with none, leaving
    // an empty section on the page.
    if (!other || other.length === 0) {
        return [];
    }

    let international = [];
    international.push((<Header as="h2" id="international">International</Header>))
    international.push((
        <Card.Group itemsPerRow={4} stackable={true}>
            {other &&
                other.map((system) => {
                    return <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)} onContactClick={onContactClick} />
                })}
        </Card.Group>
    ))
    return international;
}

export default InternationList;