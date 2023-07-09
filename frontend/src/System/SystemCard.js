import React, { Component, useState } from "react";
import {
  Card,
  Icon,
  Label,
  Grid
} from "semantic-ui-react";


function SystemCard (props) {
  
    const {system, keepShort, onClick, onContactClick} = props;
    var location = "";
    var clientCount = "";
    var callAvg = "";
    const description = system.description;



    const handleContactClick = (event) => {
      event.stopPropagation();
      onContactClick(system);
    }

    const onCardClick = (event) => {
      onClick();
    }

    if (keepShort && (description.length > 100)) {
      description = description.substring(0, 96) + "...";
    }
    if (system.callAvg) {
      callAvg = Math.round(system.callAvg * 10) / 10 + "/min"
    }
    if (system.clientCount === 1) {
      clientCount = "1 listener";
    } else if (system.clientCount > 1) {
      clientCount = system.clientCount + " listeners"
    }

    let status = (<></>)

    if (system.active) {
      status = (
        <Grid >
        <Grid.Row>
          <Grid.Column width="8">
            {clientCount && <div><Icon name='headphones' />{clientCount}</div>}
          </Grid.Column>
          <Grid.Column width="8" textAlign='right'>
            {callAvg && <div><Icon name='file audio outline' />{callAvg}</div>}
            </Grid.Column>
        </Grid.Row>
          </Grid>
      )
    } else {
      const lastActive = new Date(system.lastActive);
      status = (
        <Grid >
        <Grid.Row>
          <Grid.Column>
            <Icon name="calendar times outline"/> Last Active {lastActive.toLocaleDateString()}
          </Grid.Column>
        </Grid.Row>
          </Grid>
          
      )
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
      <Card link onClick={onCardClick} raised={true} centered={true} >
        <Card.Content>
          <Card.Header >{system.name}</Card.Header>
          <Card.Meta>{location} </Card.Meta>
          <Card.Description>
            <Grid >
            <Grid.Row>
                <Grid.Column >
                {system.screenName && <Label size="mini"><Icon name='user' /> {system.screenName}</Label>}
                {/*system.allowContact && <Label size="mini" onClick={handleContactClick}><Icon name='mail' />Message</Label>*/}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  {description}
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          {status}
        </Card.Content>
      </Card>
    );
}

export default SystemCard;
