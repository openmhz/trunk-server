import React, { Component } from "react";
import { Link, useNavigate  } from 'react-router-dom'
import SystemCard from "./SystemCard";
import {
  Container,
  Header,
  Card,
  Icon,
  Menu,
  Divider
} from "semantic-ui-react";
import  NavBar  from "../Common/NavBar"
import { selectAllSystems, selectActiveSystems, useGetSystemsQuery } from "../features/api/apiSlice";

// ----------------------------------------------------

const ListSystems = (props) => {

  
  const {data:systems, isSuccess} = useGetSystemsQuery(); 
  const navigate = useNavigate();
    return (
      <div>
        <NavBar/>
        <Container >
          <Divider horizontal style={{paddingTop:"5em", paddingBottom:"2em"}}><Header as="h1">Radio Systems<Icon name='rss' /></Header></Divider>
          <Card.Group itemsPerRow={4} stackable={true}>

          {isSuccess&&systems.systems.map((system) =>
            system.active&&<SystemCard system={system} key={system.shortName} onClick={(e) => navigate("/system/" + system.shortName)}/>
            // <SystemCard system={system} key={system.shortName} onClick={(e) => this.props.changeUrl("/system/" + system.shortName)}/>
         )}
          </Card.Group>
        </Container>
      </div>
    );
  }


export default ListSystems;
