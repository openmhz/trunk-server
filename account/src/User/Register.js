import React, { Component } from "react";
import {
  Container,
  Header,
  Message,
  Icon
} from "semantic-ui-react";

import UserForm from "./UserForm";

// ----------------------------------------------------
class Register extends Component {
  constructor(props) {
    super(props);
    this._onRegisterSubmit = this._onRegisterSubmit.bind(this);
  }

  state = {
    requestMessage: ""
  }



  _onRegisterSubmit(user) {
      this.props
        .manualRegister(user)
        .then(requestMessage => {
          if (requestMessage) {
            // report to the user is there was a problem during registration
            this.setState({
              requestMessage
            });
          }
        });
  }

  render() {
    return (
      <div>
        <Container text>
        <Message icon>
         <Icon name='trophy'/>
         <Message.Content>
           <Message.Header>Welcome!</Message.Header>
             <p>Creating an account on OpenMHz is the first step in sharing radio system recordings using Trunk Recorder.</p>
             <p>After creating an account, head over <a href="https://github.com/robotastic/trunk-recorder">here</a> to learn more about Trunk Recorder</p>
             <p> - Luke</p>
         </Message.Content>
       </Message>
       </Container>
        <Container text>
          <Header style={{ paddingTop: '20px' }} as="h1">Register</Header>
          <UserForm onSubmit={this._onRegisterSubmit} requestMessage={this.state.requestMessage} isWaiting={this.props.isWaiting}/>
        </Container>
      </div>
    );
  }
}

export default Register;
