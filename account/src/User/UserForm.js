import React, { Component } from "react";
import {
  Form,
  Dimmer,
  Loader,
  Button,
  Message,
  Icon
} from "semantic-ui-react";


// ----------------------------------------------------
class UserForm extends Component {
  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.checkInputs = this.checkInputs.bind(this);
    this.render = this.render.bind(this)

    this.state = {
      checkInputMessages: [],
      registerMessages: "",
      firstName: "",
      lastName: "",
      screenName: "",
      email: "",
      location: "",
      password: "",
      confirmPassword: "",
      firstNameError: false,
      lastNameError: false,
      screenNameError: false,
      emailError: false,
      locationError: false,
      passwordError: false,
      confirmPasswordError: false,
      isEditing: this.props.isEditing
    };
    if (this.props.isEditing) {
      this.state.firstName = this.props.user.firstName;
      this.state.lastName = this.props.user.lastName;
      this.state.screenName = this.props.user.screenName;
      this.state.email = this.props.user.email;
      this.state.location = this.props.user.location;
    }
  }



  checkInputs() {
    let error = false;
    var checkInputMessages = [];

    if (this.state.firstName === "") {
      this.setState({ firstNameError: true });
      checkInputMessages.push("First Name is required");
      error = true;
    } else {
      this.setState({ firstNameError: false });
    }

    if (this.state.lastName === "") {
      this.setState({ lastNameError: true });
      checkInputMessages.push("Last Name is required");
      error = true;
    } else {
      this.setState({ lastNameError: false });
    }

    if (this.state.email === "") {
      this.setState({ emailError: true });
      checkInputMessages.push("Email is required");
      error = true;
    } else {
      this.setState({ emailError: false });
    }

    if (this.state.location === "") {
      this.setState({ locationError: true });
      checkInputMessages.push("Location is required");
      error = true;
    } else {
      this.setState({ locationError: false });
    }

    if (this.state.screenName === "") {
      this.setState({ screenNameError: true });
      checkInputMessages.push("Screen Name is required");
      error = true;
    } else {
      this.setState({ screenNameError: false });
    }

    if (this.props.isEditing) {
      this.setState({ checkInputMessages: checkInputMessages });
      return error;
    }

    if (this.state.password === "") {
      this.setState({ passwordError: true });
      checkInputMessages.push("Password is required");
      error = true;
    } if (this.state.password.length < 7) {
      this.setState({ passwordError: true });
      checkInputMessages.push("Password must be 7 charecters or more");
      error = true;
    } else {
      this.setState({ passwordError: false });
    }

    if (this.state.password !== this.state.confirmPassword) {
      this.setState({ confirmPasswordError: true });
      checkInputMessages.push("The passwords did not match");
      error = true;
    } else {
      this.setState({ confirmPasswordError: false });
    }

    this.setState({ checkInputMessages: checkInputMessages });
    return error;
  }

  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });

  handleSubmit(event) {
    event.preventDefault();
    let inputError = this.checkInputs();

    if (!inputError) {
      const user = (({ firstName, lastName, screenName, location, email, password }) => ({ firstName, lastName, screenName, location, email, password }))(this.state);
      this.props.onSubmit(user);
    }
  }

  render() {
    var registerMessage = "";
    var floatStyle = {
      overflow: 'auto'
    }
    var dimmerProps = {};
    if (this.props.isWaiting) {
      dimmerProps["active"] = true;
    }
    const { isEditing } = this.props;
    if (this.state.checkInputMessages.length || this.props.requestMessage.length) {
      var counter = 0;
      registerMessage = (
        <Message compact warning icon>
          <Icon name="lightning" />
          <Message.Content>
            <Message.Header>Problems...</Message.Header>
            <ul>
              {this.state.checkInputMessages.map(function (listValue) {
                return <li key={`ListItem_${counter++}`}>{listValue}</li>;
              })}
              {this.props.requestMessage.length > 0 &&
                <li key="req-mess">{this.props.requestMessage}</li>
              }
            </ul>
          </Message.Content>
        </Message>
      );
    }
    return (
      <div>
        <Form
          className="raised padding segment"
          onSubmit={this.handleSubmit}
        >
          <Dimmer {...dimmerProps}>
            <Loader indeterminate>Updating Profile</Loader>
          </Dimmer>

          <Form.Group widths="equal">
            <Form.Field>
              <Form.Input
                type="text"
                name="firstName"
                onChange={this.handleInputChange}
                error={this.state.firstNameError}
                defaultValue={this.state.firstName}
                label="First name"
                placeholder="First Name..."
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                type="text"
                name="lastName"
                onChange={this.handleInputChange}
                error={this.state.lastNameError}
                defaultValue={this.state.lastName}
                label="Last name"
                placeholder="Last Name..."
              />
            </Form.Field>
          </Form.Group>
          <Form.Group widths="equal">
            <Form.Field>
              <Form.Input
                type="text"
                name="email"
                onChange={this.handleInputChange}
                error={this.state.emailError}
                defaultValue={this.state.email}
                disabled={isEditing}
                label="Email"
                placeholder="Email..."
              />

            </Form.Field>
            <Form.Field>
              <Form.Input
                type="text"
                name="screenName"
                onChange={this.handleInputChange}
                error={this.state.screenNameError}
                defaultValue={this.state.screenName}
                label="Screen Name"
                placeholder="Screen Name..."
              />
              <p style={{ fontStyle: "italic" }}>
                Shown on OpenMHz for each of your systems
                </p>
            </Form.Field>
          </Form.Group>
          <Form.Group widths="equal">
            <Form.Field>
              <Form.Input
                type="text"
                name="location"
                onChange={this.handleInputChange}
                error={this.state.locationError}
                defaultValue={this.state.location}
                label="General Location"
                placeholder="City, State..."
              />
            </Form.Field>
          </Form.Group>
          {isEditing !== true && (
            <Form.Group widths="equal">
              <Form.Field>
                <Form.Input
                  name="password"
                  type="password"
                  onChange={this.handleInputChange}
                  error={this.state.passwordError}
                  disabled={isEditing}
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
                  disabled={isEditing}
                  label="Confirm Password"
                  placeholder="Confirm Password..."
                />
              </Form.Field>
            </Form.Group>
          )}
          <div style={floatStyle}>
            <Button type="submit" size="large" floated="right" value="Login" color='blue'>
              {isEditing !== true ? 'Register' : 'Update'}
            </Button>
          </div>
        </Form>
        {registerMessage}
      </div>
    );
  }
}

export default UserForm;
