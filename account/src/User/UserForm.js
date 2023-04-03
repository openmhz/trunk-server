
import React, { useEffect, useState, } from "react";
import {
  Form,
  Dimmer,
  Loader,
  Button,
  Message,
  Icon
} from "semantic-ui-react";


// ----------------------------------------------------
const UserForm = (props) => {
  const [checkInputMessages, setCheckInputMessages] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [screenName, setScreenName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [screenNameError, setScreenNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [isEditing, setIsEditing] = useState(props.isEditing);
  const [changed, setChanged] = useState(false);
  const requestMessage = props.requestMessage;
  
  useEffect(() => {
    if (props.isEditing) {
      setFirstName(props.user.firstName);
      setLastName(props.user.lastName);
      setScreenName(props.user.screenName);
      setEmail(props.user.email);
      setLocation(props.user.location);
      setChanged(false);
    }
  }, [props.isEditing, props.user]);

  const checkInputs = () => {
    let error = false;
    let inputMessages = [];

    if (firstName === "") {
      setFirstNameError(true);
      inputMessages.push("First Name is required");
      error = true;
    } else {
      setFirstNameError(false);
    }

    if (lastName === "") {
      setLastNameError(true);
      inputMessages.push("Last Name is required");
      error = true;
    } else {
      setLastNameError(false);
    }

    if (email === "") {
      setEmailError(true);
      inputMessages.push("Email is required");
      error = true;
    } else {
      setEmailError(false);
    }

    if (location === "") {
      setLocationError(true);
      inputMessages.push("Location is required");
      error = true;
    } else {
      setLocationError(false);
    }

    if (screenName === "") {
      setScreenNameError(true);
      inputMessages.push("Screen Name is required");
      error = true;
    } else {
      setScreenNameError(false);
    }

    if (props.isEditing) {
      setCheckInputMessages(checkInputMessages);
      return error;
    }

    if (password === "") {
      setPasswordError(true);
      inputMessages.push("Password is required");
      error = true;
    } if (password.length < 7) {
      setPasswordError(true);
      inputMessages.push("Password must be 7 charecters or more");
      error = true;
    } else {
      setPasswordError(false);
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      inputMessages.push("The passwords did not match");
      error = true;
    } else {
      setConfirmPasswordError(false);
    }

    setCheckInputMessages(inputMessages);
    return error;
  }


  const handleSubmit = (event) => {
    event.preventDefault();
    let inputError = checkInputs();

    if (!inputError) {
      const user ={ firstName, lastName, screenName, location, email, password };
      setChanged(false);
      props.onSubmit(user);
    }
  }


  var registerMessage = "";
  var floatStyle = {
    overflow: 'auto'
  }
  var dimmerProps = {};
  if (props.isWaiting) {
    dimmerProps["active"] = true;
  }

  if (checkInputMessages.length || requestMessage.length) {
    var counter = 0;
    registerMessage = (
      <Message compact warning icon>
        <Icon name="lightning" />
        <Message.Content>
          <Message.Header>Problems...</Message.Header>
          <ul>
            {checkInputMessages.map(function (listValue) {
              return <li key={`ListItem_${counter++}`}>{listValue}</li>;
            })}
            {requestMessage.length > 0 &&
              <li key="req-mess">{requestMessage}</li>
            }
          </ul>
        </Message.Content>
      </Message>
    );
  }
  const buttonDisabled = changed?{}:{disabled:true}
  return (
    <div>
      <Form
        className="raised padding segment"
        onSubmit={handleSubmit}
      >
        <Dimmer {...dimmerProps}>
          <Loader indeterminate>Updating Profile</Loader>
        </Dimmer>

        <Form.Group widths="equal">
          <Form.Field>
            <Form.Input
              type="text"
              name="firstName"
              onChange={e => {setFirstName(e.target.value); setChanged(true)}}
              error={firstNameError}
              value={firstName}
              label="First name"
              placeholder="First Name..."
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              type="text"
              name="lastName"
              onChange={e => {setLastName(e.target.value); setChanged(true)}}
              error={lastNameError}
              value={lastName}
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
              onChange={e => {setEmail(e.target.value); setChanged(true)}}
              error={emailError}
              value={email}
              disabled={isEditing}
              label="Email"
              placeholder="Email..."
            />

          </Form.Field>
          <Form.Field>
            <Form.Input
              type="text"
              name="screenName"
              onChange={e => {setScreenName(e.target.value); setChanged(true)}}
              error={screenNameError}
              value={screenName}
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
              onChange={e => {setLocation(e.target.value); setChanged(true)}}
              error={locationError}
              value={location}
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
                onChange={e => {setPassword(e.target.value); setChanged(true)}}
                value={password}
                error={passwordError}
                disabled={isEditing}
                label="Password"
                placeholder="Password..."
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                name="confirmPassword"
                type="password"
                onChange={e => {setConfirmPassword(e.target.value); setChanged(true)}}
                value={confirmPassword}
                error={confirmPasswordError}
                disabled={isEditing}
                label="Confirm Password"
                placeholder="Confirm Password..."
              />
            </Form.Field>
          </Form.Group>
        )}
        <div style={floatStyle}>
          <Button type="submit" size="large" floated="right" value="Login" color='blue' disabled={!changed}>
            {isEditing !== true ? 'Register' : 'Update'}
          </Button>
        </div>
      </Form>
      {registerMessage}
    </div>
  );
}


export default UserForm;
