import { Component, useRef } from "react";
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
import { useDispatch } from 'react-redux'
import {  push } from '@lagunovsky/redux-react-router'


// ----------------------------------------------------
const ListSystems = (props) => {
  const { data, isSuccess } = useGetSystemsQuery();
  const dispatch = useDispatch();

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
            <Button onClick={(e) => dispatch(push("/create-system"))}><Icon name='plus' />Add System</Button>
            <Divider />
          <Card.Group itemsPerRow={4}>
          {systems &&
            systems.map((system) =>
            <SystemCard system={system} key={system.shortName} onClick={(e) => dispatch(push("/system/" + system.shortName))}/>
          )}
          </Card.Group>
        </Container>
      </div>
    );

}

export default ListSystems;
