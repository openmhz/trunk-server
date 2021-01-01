import React, { Component } from "react";
import {
  Card,
  Icon,
  Label,
  Grid
} from "semantic-ui-react";


class SystemCard extends Component {

  render() {
    var location = "";
    const system = this.props.system;
    var clientCount = "";
    var callAvg = "";
    var description = system.description;
    if (this.props.keepShort && (description.length > 100)) {
      description = description.substring(0, 96) + "...";
    }
    if (system.callAvg) {
      callAvg = Math.round(system.callAvg * 10) / 10 + " call/min"
    }
    if (system.clientCount === 1) {
      clientCount = "1 listener";
    } else if (system.clientCount > 1) {
      clientCount = system.clientCount + " listeners"
    }
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
          location = system.city + ", " + system.state;
      }
    }
    return (
      <Card link onClick={this.props.onClick} raised={true} centered={true} >
        <Card.Content>
          <Card.Header >{system.name}</Card.Header>
          <Card.Meta>{system.screenName && <Label size="mini"><Icon name='user' /> {system.screenName}</Label>}</Card.Meta>
        </Card.Content>
        <Card.Content description={description} />
        <Card.Content extra>
          <Icon name='marker' />
          {location}
          <Grid columns={2}>
            <Grid.Column>
              {clientCount && <div><Icon name='headphones' />{clientCount}</div>}
            </Grid.Column>
            <Grid.Column>
              {callAvg && <div><Icon name='file audio outline' />{callAvg}</div>}
            </Grid.Column>
          </Grid>
        </Card.Content>
      </Card>
    );
  }
}

export default SystemCard;
