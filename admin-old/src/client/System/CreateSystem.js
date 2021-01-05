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
  Divider,
  Message,
  Icon
} from "semantic-ui-react";

import SystemForm from "./SystemForm";

// ----------------------------------------------------
const requestMessageStyle = {
  color: "red"
};

// ----------------------------------------------------
class CreateSystem extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);

  }

  state = {
    requestMessage: ""
  }



  handleSubmit(system) {
      this.props
        .createSystem(system)
        .then(requestMessage => {
          if (requestMessage) {
            // report to the user is there was a problem during registration
            this.setState({
              requestMessage
            });
          } else {
            this.props.changeUrl("/list-systems")
          }
        });
  }

  render() {
    return (
      <div>
        <Container text>
            <Header as="h2">Join Us!</Header>
            <p>
              Record the your community's radio systems and share them! All it
              takes is a spare computer and a cheap SDR. The software you need,
              along with an explanation of how to set it up, is available{" "}
              <a href="https://github.com/robotastic/trunk-recorder">here</a>.
              </p>
              <p>
              After you have the Trunk Recorder software up and running, come
              back here and sign-up for an account so you can share your
              recordings
            </p>
            <p> - Luke</p>
        <Divider />
        <p></p>
        </Container>

        <Container text>
          <Header as="h1">Create System</Header>
          <SystemForm onSubmit={this.handleSubmit} requestMessage={this.state.requestMessage} screenName={this.props.user.screenName}/>
        </Container>
      </div>
    );
  }
}

export default CreateSystem;
