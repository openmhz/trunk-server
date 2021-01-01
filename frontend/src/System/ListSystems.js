import React, { Component } from "react";
import { Link } from 'react-router-dom'
import SystemCard from "./SystemCard";
import {
  Container,
  Header,
  Card,
  Icon,
  Menu,
  Divider
} from "semantic-ui-react";


// ----------------------------------------------------
class ListSystems extends Component {

  state = {
    requestMessage: "",
  }
  
  componentDidMount() {
  		this.props.fetchSystems();
  	}

//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const systems = this.props.system.items;
    return (
      <div>
        <Menu fixed="top">
          <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
          <Link to="/about"><Menu.Item link>About</Menu.Item></Link>
        </Menu>
        <Container >
          <Divider horizontal style={{paddingTop:"5em", paddingBottom:"2em"}}><Header as="h1">Radio Systems<Icon name='rss' /></Header></Divider>
          <Card.Group itemsPerRow={4} stackable={true}>
          {systems.map((system) =>
            system.active&&<SystemCard system={system} key={system.shortName} onClick={(e) => this.props.changeUrl("/system/" + system.shortName)}/>
            // <SystemCard system={system} key={system.shortName} onClick={(e) => this.props.changeUrl("/system/" + system.shortName)}/>
         )}
          </Card.Group>
        </Container>
      </div>
    );
  }
}

export default ListSystems;
