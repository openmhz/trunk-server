import { Component, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom'

import { useSelector, useDispatch } from 'react-redux'
import {
  Container,
  Header,
  Card,
  Icon,
  Menu,
  Divider,
  List,
  Segment,
  Sticky,
  Rail,
  Grid
} from "semantic-ui-react";
import NavBar from "../Common/NavBar"
import { selectAllSystems, selectActiveSystems, } from "../features/systems/systemsSlice";
import { useGetSystemsQuery, } from '../features/api/apiSlice'
import StateLinkList from "./StateLinkList";
import SystemsByState from "./SystemsByState";
import InternationList from "./InternationList";
// ----------------------------------------------------

const ListSystems = (props) => {

  const { data: allSystems, isSuccess } = useGetSystemsQuery();
  const systems = useSelector(selectActiveSystems)
  const contextRef = useRef();

  // Sorts the systems by State and also creates an International Arry
  let states = {};
  let other = []
  for (var i = 0; i < systems.length; i++) {
    const system = systems[i];
    if (system.hasOwnProperty("state")) {
      if (!states.hasOwnProperty(system.state)) {
        states[system.state] = [];
      }
      states[system.state].push(system);
    } else {
      other.push(system);
    }
  }

  const stateList = StateLinkList(states);
  const systemsByState = SystemsByState(states);
  const international = InternationList(other);

  return (
    <div ref={contextRef}>
      <NavBar />
      <Container >
        <Divider horizontal style={{ paddingTop: "5em", paddingBottom: "2em" }}><Header as="h1">Radio Systems<Icon name='rss' /></Header></Divider>
        <Grid centered columns={2}>
          <Grid.Column width="15">
            <List horizontal>
              {stateList}
              <List.Item>
                <List.Content>
                  <List.Header><a href="#international">International</a></List.Header>
                </List.Content>
              </List.Item>
            </List>
            {systemsByState}
            {international}
          </Grid.Column>
          <Grid.Column width="1">
            <Sticky offset={60} context={contextRef}>
              <Segment>
                <List >
                  {stateList}
                </List>
              </Segment>
            </Sticky>
          </Grid.Column>
        </Grid>
      </Container>
    </div>
  );
}


export default ListSystems;
