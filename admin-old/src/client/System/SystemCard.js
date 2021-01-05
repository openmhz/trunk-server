
import React, { Component } from "react";
import {
  Card,
  Icon,
  Label,
  Header
} from "semantic-ui-react";


function planName(planType) {
  switch(planType) {
    case freePlanValue:
    return "Free";
    case proPlanValue:
    return "Pro";
  }
}


class SystemCard extends Component {
constructor(props) {
  super(props);
}

render() {
  var location = "";
  const system = this.props.system;
  var plan=null;
  
  if (system) {
    
    if (system.planType) {
      plan = planName(system.planType);
    }
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
  </Header>{plan&&<Label color='orange' ribbon='right'>{plan}</Label>}
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
