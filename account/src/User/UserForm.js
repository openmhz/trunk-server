
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
  const [callsign, setCallsign] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [callsignError, setCallsignError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [countryError, setCountryError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [isEditing] = useState(props.isEditing);
  const [changed, setChanged] = useState(false);
  const requestMessage = props.requestMessage;

  useEffect(() => {
    if (props.isEditing) {
      setFirstName(props.user.firstName);
      setLastName(props.user.lastName);
      // Stored lowercase, shown uppercase - see the callsign field below.
      setCallsign((props.user.callsign || "").toUpperCase());
      setEmail(props.user.email);
      setCity(props.user.city || "");
      setState(props.user.state || "");
      setCountry(props.user.country || "");
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

    if (city === "") {
      setCityError(true);
      inputMessages.push("City is required");
      error = true;
    } else {
      setCityError(false);
    }

    if (country === "") {
      setCountryError(true);
      inputMessages.push("Country is required");
      error = true;
    } else {
      setCountryError(false);
    }

    // Mirrors the server rule in validateProfile so the message arrives before
    // a round trip. 3 to 7 characters covers base callsigns worldwide.
    if (callsign === "") {
      setCallsignError(true);
      inputMessages.push("Callsign is required");
      error = true;
    } else if (!/^[A-Z0-9]{3,7}$/.test(callsign)) {
      setCallsignError(true);
      inputMessages.push("Callsign must be 3 to 7 letters and numbers, with no spaces or punctuation");
      error = true;
    } else {
      setCallsignError(false);
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
      // The callsign goes up as typed - the server lowercases it, and the
      // model derives screenName from it.
      const user = { firstName, lastName, callsign, city, state, country, email, password };
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
              name="callsign"
              maxLength={7}
              // Uppercased as you type so what you see here matches how it is
              // displayed everywhere else. The server stores it lowercase.
              onChange={e => {setCallsign(e.target.value.toUpperCase()); setChanged(true)}}
              error={callsignError}
              value={callsign}
              label="Amateur Radio Callsign"
              placeholder="N0CALL"
            />
            <p style={{ fontStyle: "italic" }}>
              Your callsign is how you are identified on {process.env.REACT_APP_SITE_NAME}
            </p>
          </Form.Field>
        </Form.Group>
        <Form.Group widths="equal">
          <Form.Field>
            <Form.Input
              type="text"
              name="city"
              onChange={e => {setCity(e.target.value); setChanged(true)}}
              error={cityError}
              value={city}
              label="City"
              placeholder="City..."
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              type="text"
              name="state"
              onChange={e => {setState(e.target.value); setChanged(true)}}
              value={state}
              label="State / Province / Region"
              placeholder="Optional..."
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              type="text"
              name="country"
              onChange={e => {setCountry(e.target.value); setChanged(true)}}
              error={countryError}
              value={country}
              label="Country"
              placeholder="Country..."
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
