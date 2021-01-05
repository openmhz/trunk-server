import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  Container,
  Header,
  Form,
  Grid,
  Segment,
  Input,
  Button,
  Message,
  Step,
  Icon
} from "semantic-ui-react";

import SystemForm from "./SystemForm";

// ----------------------------------------------------
const requestMessageStyle = {
  color: "red"
};

// ----------------------------------------------------
class PreCreateSystem extends Component {
  constructor(props) {
    super(props);

  }

  state = {
    requestMessage: ""
  }



  render() {
    return (
      <div>
    <Step.Group attached='top' widths={3}>
      <Step>
        <Icon name='wifi' />
        <Step.Content>
          <Step.Title>Trunk Recorder</Step.Title>
          <Step.Description>Choose your shipping options</Step.Description>
        </Step.Content>
      </Step>

      <Step active>
        <Icon name='payment' />
        <Step.Content>
          <Step.Title>Billing</Step.Title>
          <Step.Description>Enter billing information</Step.Description>
        </Step.Content>
      </Step>

      <Step disabled>
        <Icon name='info' />
        <Step.Content>
          <Step.Title>Confirm Order</Step.Title>
        </Step.Content>
      </Step>
    </Step.Group>

    <Segment attached>
      <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
    </Segment>
      </div>
    );
  }
}

export default PreCreateSystem;
