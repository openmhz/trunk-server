import React, { Component } from "react";
import { Link, useNavigate } from 'react-router-dom'
import SystemCard from "./SystemCard";
import { useSelector, useDispatch } from 'react-redux'
import {
  Container,
  Header,
  Card,
  Icon,
  Menu,
  Divider
} from "semantic-ui-react";
import NavBar from "../Common/NavBar"
import { selectAllSystems, selectActiveSystems, } from "../features/systems/systemsSlice";
import { useGetSystemsQuery, } from '../features/api/apiSlice'
// ----------------------------------------------------

const ListSystems = (props) => {

  const { data: allSystems, isSuccess } = useGetSystemsQuery();
  const systems = useSelector(selectActiveSystems)
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

  let systemsByState = [];
  let keys = Object.keys(states);
  keys.sort();
  for(var i=0; i<keys.length; ++i){
    const state = keys[i];    
  
    systemsByState.push((<Header as="h2">{state}</Header>))
    systemsByState.push((
      <Card.Group key={state} itemsPerRow={4} stackable={true}>
        {
          states[state].map((system) => {
            return <SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)} />
          })}
      </Card.Group>
    ))
  }

  const navigate = useNavigate();
  return (
    <div>
      <NavBar />
      <Container >
        <Divider horizontal style={{ paddingTop: "5em", paddingBottom: "2em" }}><Header as="h1">Radio Systems<Icon name='rss' /></Header></Divider>
        {systemsByState}
      </Container>
    </div>
  );
}


export default ListSystems;
