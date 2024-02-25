import React, { useEffect,  useState } from "react";
import {
  Divider,
  Form,
  Button,
  Message,
  Checkbox,
  Icon
} from "semantic-ui-react";

// ----------------------------------------------------
const SystemForm = (props) => {




  const [checkInputMessages, setCheckInputMessage] = useState([]);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [systemType, setSystemType] = useState("state");
  const [systemState, setSystemState] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [country, setCountry] = useState("");
  const [showScreenName, setShowScreenName] = useState(false);
  const [allowContact, setAllowContact] = useState(true);
  const [ignoreUnknownTalkgroup, setIgnoreUnknownTalkgroup] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [shortNameError, setShortNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [systemStateError, setSystemStateError] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [countyError, setCountyError] = useState(false);
  const [countryError, setCountryError] = useState(false);
  const [isEditing] = useState(props.isEditing);

  useEffect(() => {
    if (props.isEditing && props.system) {
      var statusSet = (props.system.status && props.system.status.length > 0 ) ? true : false;
      setName(props.system.name);
      setShortName(props.system.shortName);
      setDescription(props.system.description);
      setStatus(props.system.status);
      setShowStatus(statusSet);
      setSystemType(props.system.systemType);
      setCity(props.system.city);
      setSystemState(props.system.state)
      setCounty(props.system.county);
      setCountry(props.system.country);
      setShowScreenName(props.system.showScreenName);
      setAllowContact(props.system.allowContact);
      setIgnoreUnknownTalkgroup(props.system.ignoreUnknownTalkgroup);
    }
  }, [props.system, props.isEditing]);


  const checkInputs = () => {
    let error = false;
    var messages = [];

    if (name === "") {
      setNameError(true);
      messages.push("System Name is required");
      error = true;
    } else {
      setNameError(false);
    }

    if (shortName.length < 4 || shortName.length > 10) {
      setShortNameError(true)
      messages.push(
        "Short Name for the system has to be 4-10 charecters"
      );
      error = true;
    } else {
      setShortNameError(false);
    }

    if (description === "") {
      setDescriptionError(true);
      messages.push("System description is required");
      error = true;
    } else {
      setDescriptionError(false);
    }

    if (showStatus && status.length < 4) {
      setStatusError(true);
      messages.push("If showing a aStatus message it must be at least 4 characters");
      error = true;
    } else {
      setStatusError(false);
    }

    if (
      systemType === "state" ||
      systemType === "city" ||
      systemType === "county"
    ) {
      if (systemState === "") {
        setSystemStateError(true);
        messages.push("Select a state");
        error = true;
      } else {
        setSystemStateError(false);
      }
    }

    if (systemType === "city") {
      if (city === "") {
        setCityError(true);
        messages.push("Enter a city");
        error = true;
      } else {
        setCityError(false);
      }
    }

    if (systemType === "county") {
      if (county === "") {
        setCountyError(true)
        messages.push("Enter a county");
        error = true;
      } else {
        setCountyError(false);
      }
    }

    if (systemType === "international") {
      if (country === "") {
        setCountryError(true);
        messages.push("Enter a country");
        error = true;
      } else {
        setCountryError(false);
      }
    }

    setCheckInputMessage(messages);
    return error;
  }

  const handleShowStatusCheckboxChange = () => {
    if (showStatus) {
      setStatus("");
    }
    setShowStatus((current) => !current);
  }

  const handleAllowContactCheckboxChange = () => {
    setAllowContact((current) => !current);
  }

  const handleScreenNameCheckboxChange = () => {
    setShowScreenName((current) => !current);
  }

  const handleTalkgroupCheckboxChange = () => {
    setIgnoreUnknownTalkgroup((current) => !current);
  }
  const handleSubmit = (event) => {
    event.preventDefault();
    let inputError = checkInputs();

    if (!inputError) {
      const system = {
        name,
        shortName,
        description,
        status,
        systemType,
        city,
        state: systemState,
        county,
        country,
        showScreenName,
        allowContact,
        ignoreUnknownTalkgroup
      };
      props.onSubmit(system);
    }
  }


  var requestMessage = "";
  var floatStyle = {
    overflow: "auto"
  };

  const stateOptions = [
    { value: "AL", text: "Alabama" },
    { value: "AK", text: "Alaska" },
    { value: "AZ", text: "Arizona" },
    { value: "AR", text: "Arkansas" },
    { value: "CA", text: "California" },
    { value: "CO", text: "Colorado" },
    { value: "CT", text: "Connecticut" },
    { value: "DE", text: "Delaware" },
    { value: "DC", text: "District Of Columbia" },
    { value: "FL", text: "Florida" },
    { value: "GA", text: "Georgia" },
    { value: "HI", text: "Hawaii" },
    { value: "ID", text: "Idaho" },
    { value: "IL", text: "Illinois" },
    { value: "IN", text: "Indiana" },
    { value: "IA", text: "Iowa" },
    { value: "KS", text: "Kansas" },
    { value: "KY", text: "Kentucky" },
    { value: "LA", text: "Louisiana" },
    { value: "ME", text: "Maine" },
    { value: "MD", text: "Maryland" },
    { value: "MA", text: "Massachusetts" },
    { value: "MI", text: "Michigan" },
    { value: "MN", text: "Minnesota" },
    { value: "MS", text: "Mississippi" },
    { value: "MO", text: "Missouri" },
    { value: "MT", text: "Montana" },
    { value: "NE", text: "Nebraska" },
    { value: "NV", text: "Nevada" },
    { value: "NH", text: "New Hampshire" },
    { value: "NJ", text: "New Jersey" },
    { value: "NM", text: "New Mexico" },
    { value: "NY", text: "New York" },
    { value: "NC", text: "North Carolina" },
    { value: "ND", text: "North Dakota" },
    { value: "OH", text: "Ohio" },
    { value: "OK", text: "Oklahoma" },
    { value: "OR", text: "Oregon" },
    { value: "PA", text: "Pennsylvania" },
    { value: "RI", text: "Rhode Island" },
    { value: "SC", text: "South Carolina" },
    { value: "SD", text: "South Dakota" },
    { value: "TN", text: "Tennessee" },
    { value: "TX", text: "Texas" },
    { value: "UT", text: "Utah" },
    { value: "VT", text: "Vermont" },
    { value: "VA", text: "Virginia" },
    { value: "WA", text: "Washington" },
    { value: "WV", text: "West Virginia" },
    { value: "WI", text: "Wisconsin" },
    { value: "WY", text: "Wyoming" }
  ];
  if (
    checkInputMessages.length ||
    props.requestMessage.length
  ) {
    var counter = 0;
    requestMessage = (
      <Message compact warning icon>
        <Icon name="lightning" />
        <Message.Content>
          <Message.Header>Problems...</Message.Header>
          <ul>
            {checkInputMessages.map(function (listValue) {
              return <li key={`ListItem_${counter++}`}>{listValue}</li>;
            })}
            {props.requestMessage.length > 0 && (
              <li key="req-mess">{props.requestMessage}</li>
            )}
          </ul>
        </Message.Content>
      </Message>
    );
  }
  return (
    <div>
      <Form className="raised padding segment" onSubmit={handleSubmit}>
        <Form.Group widths="equal">
          <Form.Field>
            <Form.Input
              type="text"
              name="name"
              onChange={e => setName(e.target.value)}
              error={nameError}
              value={name}
              label="System name"
              placeholder="System Name..."
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              type="text"
              name="shortName"
              onChange={e => setShortName(e.target.value)}
              error={shortNameError}
              value={shortName}
              disabled={isEditing}
              label="System Short Name (4-10 characters)"
              placeholder="Short Name..."
            />
          </Form.Field>
        </Form.Group>
        <Divider horizontal />
        <Form.Field>
          <Checkbox
            onChange={handleScreenNameCheckboxChange}
            checked={showScreenName}
            label="Display Screen Name in System Listing" />
        </Form.Field>
        <Form.Field>
          <Checkbox
            onChange={handleAllowContactCheckboxChange}
            checked={allowContact}
            label="Allow Users to Contact you via a Web Form. They will not get your email address unless you write them back." />
        </Form.Field>
        <Form.Field>
          <Checkbox
            onChange={handleTalkgroupCheckboxChange}
            checked={ignoreUnknownTalkgroup}
            label="Ignore Unknown Talkgroups" />
        </Form.Field>
        <Divider horizontal />
        <Form.TextArea
          label="Description"
          name="description"
          onChange={e => setDescription(e.target.value)}
          error={descriptionError}
          value={description}
          rows={2}
          placeholder="Description of system..."
        />
        <Divider horizontal> System Status </Divider>
        <Form.Field>
          <Checkbox
            onChange={handleShowStatusCheckboxChange}
            checked={showStatus}
            label="Show Status Message" />
        </Form.Field>
        <Form.TextArea
          label="Status Message"
          name="status"
          onChange={e => setStatus(e.target.value)}
          error={statusError}
          value={status}
          disabled={!showStatus}
          rows={1}
          placeholder="System status..."
        />
        Only needed if things are not working. Provide notification on maintenance or is you know if some channels are not available.
        <Divider horizontal><Icon name="marker" />Location</Divider>
        <Form.Group inline>
          <label>System Type</label>
          <Form.Radio
            label="State"
            name="systemType"
            value="state"
            checked={systemType === "state"}
            onChange={e => setSystemType("state")}
          />
          <Form.Radio
            label="County"
            name="systemType"
            value="county"
            checked={systemType === "county"}
            onChange={e => setSystemType("county")}
          />
          <Form.Radio
            label="City"
            name="systemType"
            value="city"
            checked={systemType === "city"}
            onChange={e => setSystemType("city")}
          />
          <Form.Radio
            label="International"
            name="systemType"
            value="international"
            checked={systemType === "international"}
            onChange={e => setSystemType("international")}
          />
        </Form.Group>
        <Form.Group widths="equal">

          {systemType === "city" && (
            <Form.Field>
              <Form.Input
                type="text"
                name="city"
                onChange={e => setCity(e.target.value)}
                error={cityError}
                value={city}
                label="City"
                placeholder="City..."
              />
            </Form.Field>
          )}
          {systemType === "county" && (
            <Form.Field>
              <Form.Input
                type="text"
                name="county"
                onChange={e => setCounty(e.target.value)}
                error={countyError}
                value={county}
                label="County"
                placeholder="County..."
              />
            </Form.Field>
          )}
          {systemType === "international" ? (
            <Form.Field>
              <Form.Input
                type="text"
                name="country"
                onChange={e => setCountry(e.target.value)}
                error={countryError}
                value={country}
                label="Country"
                placeholder="Country..."
              />
            </Form.Field>
          ) : (
            <Form.Field>
              <Form.Dropdown
                name="state"
                onChange={(e, data ) => {setSystemState(data.value); console.log(data.value)}}
                error={systemStateError}
                value={systemState}
                options={stateOptions}
                scrolling
                label="State"
                placeholder="Select State..."
              />
            </Form.Field>
          )}

        </Form.Group>

        <div style={floatStyle}>
          <Button type="submit" size="large" floated="right" value="Login">
            {isEditing !== true ? "Create" : "Update"}
          </Button>
        </div>
      </Form>
      {requestMessage}
    </div>
  );
}


export default SystemForm;
