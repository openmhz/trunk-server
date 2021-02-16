import React, { Component } from "react";
import {
  Container,
  Form,
  Segment,
  Button,
} from "semantic-ui-react";

class ResetPassword extends Component {
  constructor(props) {
    super(props);
    this.handleResetPassword = this.handleResetPassword.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }
  state = {
    checkInputMessages: [],
    password: "",
    confirmPassword: "",
    passwordError: false,
    confirmPasswordError: false,
    sentReset: false
  };


  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });

  handleResetPassword(event) {
    let error = false;
    var checkInputMessages = [];

    if (this.state.password === "") {
      this.setState({ passwordError: true });
      checkInputMessages.push("Password is required");
      error = true;
    } if (this.state.password.length < 7) {
      this.setState({ passwordError: true });
      checkInputMessages.push("Password must be 7 charecters or more");
      error = true;
    }else {
      this.setState({ passwordError: false });
    }

    if (this.state.password !== this.state.confirmPassword) {
      this.setState({ confirmPasswordError: true });
      checkInputMessages.push("The passwords did not match");
      error = true;
    } else {
      this.setState({ confirmPasswordError: false });
    }

    const { match: { params } } = this.props;
    this.setState({ checkInputMessages: checkInputMessages });
    if (!error) {
      this.props.resetPassword(params.userId, params.token, this.state.password).then(resetSent => {
        this.setState({resetSent: true});
      });
    }
  }


  render() {
    return (
      <div>
        <Container text>
        <Segment>
        <Form
          className="raised padding segment"
          onSubmit={this.handleSubmit}
        >
        <Form.Group widths="equal">
          <Form.Field>
            <Form.Input
              name="password"
              type="password"
              onChange={this.handleInputChange}
              error={this.state.passwordError}
              label="Password"
              placeholder="Password..."
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              name="confirmPassword"
              type="password"
              onChange={this.handleInputChange}
              error={this.state.confirmPasswordError}
              label="Confirm Password"
              placeholder="Confirm Password..."
            />
          </Form.Field>
        </Form.Group>
        <Button
          size="large"
          content="Reset Password"
          onClick={this.handleResetPassword}
          fluid
        />
      </Form>
      </Segment>
      </Container>
      </div>
    );
  }
}

export default ResetPassword;
