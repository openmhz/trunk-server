import React, { Component } from "react";
import {
  Form,
  Grid,
  Segment,
  Button,
  Message,
  Icon
} from "semantic-ui-react";
import { Link } from "react-router-dom";

const returnStyle = {
  marginTop: "30px"
};

class SendResetPassword extends Component {

  constructor(props) {
    super(props);
    this.handleSendResetPassword = this.handleSendResetPassword.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }
  state = {
    checkInputMessages: "",
    email: "",
    emailError: false,
    sentReset: false
  };

  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });

  handleSendResetPassword(event) {


    if (this.state.email === "") {
      this.setState({ emailError: true, checkInputMessages:  "Email is required"});

    } else {
      this.setState({ emailError: false });

      this.props.sendResetPassword({email: this.state.email}).then(resetMessage => {
        if (resetMessage) {
          // report to the user is there was a problem during login

          this.setState({resetSent: false, checkInputMessages: resetMessage, emailError: true});
        } else {
        this.setState({resetSent: true});
      }
      });
    }
  }
  render() {
    var resetMessage = "";
    if (this.state.checkInputMessages.length) {
      resetMessage = (
        <Message compact warning icon>
          <Icon name="lightning" />
          <Message.Content>
            <Message.Header>Problems...</Message.Header>

              {this.state.checkInputMessages}

          </Message.Content>
        </Message>
      );
    }
    return (


          <Grid verticalAlign='middle'  centered>
    <Grid.Row>

      <Grid.Column width="6">
        { !this.state.resetSent ? (
<div>
        <h2>Forgot your password?</h2>
        <Form className="raised padding segment" onSubmit={this.handleSubmit}>
          Enter the email address for your account.
          <Form.Field>
            <Form.Input
              type="text"
              name="email"
              onChange={this.handleInputChange}
              error={this.state.emailError}
              label="Email"
              placeholder="Email..."
            />
          </Form.Field>
          <Button
            size="large"
            content="Reset Password"
            onClick={this.handleSendResetPassword}
            fluid
          />
        </Form>
        {resetMessage}
        </div>
      )
            :( <Segment raised padded='very'>
              <h2>Reset Link Sent </h2>
              <div>An email with a link to reset your password was sent to: {this.state.email}</div>
              <Link to="/" style={returnStyle}><Icon name="left arrow"/>Back to OpenMHz</Link>
              </Segment>
            )}
      </Grid.Column>
    </Grid.Row>
  </Grid>
    );
  }
}

export default SendResetPassword;
