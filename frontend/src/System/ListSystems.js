import React, { Component, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom'
import SystemCard from "./SystemCard";
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
// ----------------------------------------------------

const ListSystems = (props) => {

  const { data: allSystems, isSuccess } = useGetSystemsQuery();
  const systems = useSelector(selectActiveSystems)
  const contextRef = useRef();
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
  let keys = Object.keys(states);
  keys.sort();

  let stateList = [];
  for (var i = 0; i < keys.length; ++i) {
    const state = keys[i];
    stateList.push((

      <List.Item>
        <List.Content>
          <List.Header><a href={"#" + state}>{state}</a></List.Header>
        </List.Content>
      </List.Item>

    ))
  }

  let systemsByState = [];

  for (var i = 0; i < keys.length; ++i) {
    const state = keys[i];

    systemsByState.push((<Header as="h2" id={state}>{state}</Header>))
    systemsByState.push((
      <Card.Group key={state} itemsPerRow={4} stackable={true}>
        {states[state] &&
          states[state].map((system) => {
            return <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)} />
          })}
      </Card.Group>
    ))
  }
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
  const navigate = useNavigate();
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
