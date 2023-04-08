import SystemCard from "./SystemCard";
import {
  Container,
  Divider,
  Header,
  Card,
  Icon,
  Button,
} from "semantic-ui-react";
import { useGetSystemsQuery, } from '../features/api/apiSlice'
import { useNavigate } from 'react-router-dom';


// ----------------------------------------------------
const ListSystems = () => {
  const { data, isSuccess } = useGetSystemsQuery();
  const navigate = useNavigate();
  let systems = false;
  if (isSuccess) {
    systems = data.systems;
  }

//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter

    return (
      <div>
        <Container>
          <Header as="h1">Radio Systems</Header>
            <Button onClick={(e) => navigate("/create-system")}><Icon name='plus' />Add System</Button>
            <Divider />
          <Card.Group itemsPerRow={4}>
          {systems &&
            systems.map((system) =>
            <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)}/>
          )}
          </Card.Group>
        </Container>
      </div>
    );

}

export default ListSystems;
