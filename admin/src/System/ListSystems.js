import React, { Component } from "react";
import SystemCard from "./SystemCard";
import {
  Container,
  Divider,
  Header,
  Card,
  Icon,
  Button,
} from "semantic-ui-react";


// ----------------------------------------------------
class ListSystems extends Component {

  state = {

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
        <Container>
          <Header as="h1">Radio Systems</Header>
            <Button onClick={(e) => this.props.changeUrl("/create-system")}><Icon name='plus' />Add System</Button>
            <Divider />
          <Card.Group itemsPerRow={4}>
          {systems.map((system) =>
            <SystemCard system={system} key={system.shortName} onClick={(e) => this.props.changeUrl("/system/" + system.shortName)}/>
          )}
          </Card.Group>
        </Container>
      </div>
    );
  }
}

export default ListSystems;
