import React, {  Component } from "react";
import { Link } from "react-router-dom";

import {
  Container,
  Header,
  Form,
  Grid,
  Segment,
  Button,
  Message,
  Icon,
  Divider
} from "semantic-ui-react";

// ----------------------------------------------------
const dividerStyle = {
  marginTop: "40px"
};

const forgotStyle = {
  marginTop: "40px",
  textAlign: "right"
};

// ----------------------------------------------------


class Login extends Component {
  constructor(props) {
    super(props);
    this._onLoginSubmit = this._onLoginSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleRegisterClick = this.handleRegisterClick.bind(this);
  }

  state = {
    loginMessage: "",
    email: "",
    password: ""
  };
  handleRegisterClick = () => {
    this.props.changeUrl("/register");
  };
  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });
  _onLoginSubmit(event) {
    event.preventDefault();
    const { email, password } = this.state;
    var success = { type: "path", nextPathname: "/" };
    if (this.props.nextPathname) {
      success.nextPathname = this.props.nextPathname;
    }
    if (this.props.nextLocation) {
      success.type = "location";
      switch (this.props.nextLocation) {
        case "frontend":
          success.nextLocation = process.env.REACT_APP_FRONTEND_SERVER;
          break;
          default:
          case "admin":
            success.nextLocation = process.env.REACT_APP_ADMIN_SERVER;
            break;
      }
    }

    // Passed in via react-redux. Returns a promise.
    this.props
      .manualLogin(
        {
          // this function is passed in via react-redux
          email,
          password
        },
        success

      ) // holds the path to redirect to after login (if any)
      .then(loginMessage => {
        if (loginMessage) {
          // report to the user is there was a problem during login
          this.setState({
            loginMessage
          });
        }
      });
  }

  render() {
    var loginMessage = "";

    if (this.state.loginMessage) {
      loginMessage = (
        <Message icon>
          <Icon name="lemon" />
          <Message.Content>
            <Message.Header>Problems...</Message.Header>
            {this.state.loginMessage}
          </Message.Content>
        </Message>
      );
    }

    return (
      <Container>
        <Header as="h1">{process.env.REACT_APP_SITE_NAME}</Header>
        <Grid stackable >
          <Grid.Row>
            <Grid.Column width={9}>

              <Header size="large">Let's get this started!</Header>
              <Header size="small">
                {process.env.REACT_APP_SITE_NAME} makes it easy to share recordings from{" "}
                <a href="https://github.com/robotastic/trunk-recorder">
                  Trunk Recorder
                  </a>.</Header>
              <p>
                Trunk Recorder makes it easy to record the radio systems
                used by your local police and fire department. Trunk Recorder
                is sort of like an awesome version of those Scanners from
                Radio Shack... 10-4!
                </p>
              <p>
                This site is a work in progress. I plan on adding more
                features over time, but right now it can:
                </p>
              <ul>
                <li>30 day archive</li>
                <li>Filter by talkgroup</li>
              </ul>
              <p>
                All of this goodness is free! In the future, I might offer
                paid accounts with additional features and a longer archive
                period, but I will always try to have a free version.
                </p>
              <p>
                {" "}
                  - Luke{" "}
                <a
                  href="mailto:{process.env.REACT_APP_ADMIN_EMAIL}?Subject={process.env.REACT_APP_SITE_NAME}"
                  target="_top"
                >
                  admin@email.com
                  </a>{" "}
              </p>
            </Grid.Column>
            <Grid.Column floated="right" width={6}>
              <Header as="h3">Need an account?</Header>
              <Button
                size="large"
                content="Register"
                onClick={this.handleRegisterClick}
                fluid
              />
              <Divider style={dividerStyle} horizontal>Or</Divider>
              <Header as="h3">Login</Header>
              <Form onSubmit={this._onLoginSubmit}>
                <Segment padded>
                  <Form.Field>
                    <Form.Input
                      icon="user"
                      iconPosition="left"
                      type="text"
                      name="email"
                      onChange={this.handleInputChange}
                      placeholder="E-mail address"
                    />
                  </Form.Field>
                  <Form.Field>
                    <Form.Input
                      icon="lock"
                      iconPosition="left"
                      type="password"
                      name="password"
                      onChange={this.handleInputChange}
                      placeholder="Password"
                    />
                  </Form.Field>

                  <Button type="submit" size="large" value="Login" fluid>
                    Login
                  </Button>
                  {loginMessage}
                </Segment>
              </Form>
              <div style={forgotStyle} >
                <Link to="/send-reset-password">Forgot Password</Link>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    );
  }
}

export default Login;
