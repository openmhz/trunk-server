import {
  Card,
  Header
} from "semantic-ui-react";
import { useNavigate } from 'react-router-dom'
import SystemCard from "./SystemCard";


const TrendingList = (popularSystems, onContactClick) => {
  
  const navigate = useNavigate();
  let trending = [];
  trending.push((<Header as="h2" id="trending">Trending</Header>))
  trending.push((
      <Card.Group itemsPerRow={4} stackable={true}>
          {popularSystems &&
              popularSystems.map((system) => {
                  return <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)} onContactClick={onContactClick} />
              })}
      </Card.Group>
  ))
  return trending;
}

export default TrendingList;