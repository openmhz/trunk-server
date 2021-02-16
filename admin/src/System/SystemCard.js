
import React, { Component } from "react";
import {
  Card,
  Icon,
  Header
} from "semantic-ui-react";




class SystemCard extends Component {

render() {
  var location = "";
  const system = this.props.system;

  
  if (system) {
    

    switch (system.systemType) {
      case "state":
        location = system.state;
        break;
      case "city":
        location = system.city + ", " + system.state;
        break;
      case "county":
        location = system.county + ", " + system.state;
        break;
      case "international":
        location = system.country;
        break;
      default:
        location = "unknown";
    }
  }
  return (
    <Card link onClick={this.props.onClick}>
    
    <Card.Content>
    <Header size='medium'>
    <Header.Content>
    {system.name}
      <Header.Subheader>{system.screenName}</Header.Subheader>
    </Header.Content>
  </Header>
   </Card.Content><Card.Content>

   <Card.Description>{system.description}</Card.Description>
   </Card.Content>
   <Card.Content extra>
     <Icon name='marker' />
     {location}
   </Card.Content>
 </Card>
  );
}
}

export default SystemCard;
