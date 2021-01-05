import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  Container,
  Header,
  Dropdown,
  Divider,
  TextArea,
  Form,
  Grid,
  Segment,
  Input,
  Button,
  Message,
  Checkbox,
  Icon
} from "semantic-ui-react";

// ----------------------------------------------------
const checkInputMessagestyle = {
  color: "red"
};

// ----------------------------------------------------
class SystemForm extends Component {
  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.checkInputs = this.checkInputs.bind(this);
    this.render = this.render.bind(this);


    this.state = {
      checkInputMessages: [],
      name: "",
      shortName: "",
      description: "",
      systemType: "state",
      state: "",
      city: "",
      county: "",
      country: "",
      showScreenName: false,
      nameError: false,
      shortNameError: false,
      descriptionError: false,
      emailError: false,
      systemTypeError: false,
      stateError: false,
      cityErorr: false,
      countyError: false,
      countryError: false,
      isEditing: this.props.isEditing
    };
    if (this.props.isEditing && this.props.system)
    {
      this.state.name = this.props.system.name;
      this.state.shortName = this.props.system.shortName;
      this.state.description = this.props.system.description;
      this.state.systemType = this.props.system.systemType;
      this.state.city = this.props.system.city;
      this.state.state = this.props.system.state;
      this.state.county = this.props.system.county;
      this.state.country = this.props.system.country;
      this.state.showScreenName = this.props.system.showScreenName;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isEditing && nextProps.system) {
      this.setState({
        name: nextProps.system.name,
        shortName: nextProps.system.shortName,
        description: nextProps.system.description,
        systemType: nextProps.system.systemType,
        state: nextProps.system.state,
        county: nextProps.system.county,
        country: nextProps.system.country,
        showScreenName: nextProps.system.showScreenName,
      });
    }
  }
  checkInputs() {
    let error = false;
    var checkInputMessages = [];

    if (this.state.name === "") {
      this.setState({ nameError: true });
      checkInputMessages.push("System Name is required");
      error = true;
    } else {
      this.setState({ nameError: false });
    }

    if (this.state.shortName.length == 0 || this.state.shortName.length > 10) {
      this.setState({ shortNameError: true });
      checkInputMessages.push(
        "Short Name for the system has to be 4-10 charecters"
      );
      error = true;
    } else {
      this.setState({ shortNameError: false });
    }

    if (this.state.description === "") {
      this.setState({ descriptionError: true });
      checkInputMessages.push("System description is required");
      error = true;
    } else {
      this.setState({ descriptionError: false });
    }

    if (
      this.state.systemType === "state" ||
      this.state.systemType === "city" ||
      this.state.systemType === "county"
    ) {
      if (this.state.state === "") {
        this.setState({ stateError: true });
        checkInputMessages.push("Select a state");
        error = true;
      } else {
        this.setState({ stateError: false });
      }
    }

    if (this.state.systemType === "city") {
      if (this.state.city === "") {
        this.setState({ cityError: true });
        checkInputMessages.push("Enter a city");
        error = true;
      } else {
        this.setState({ cityError: false });
      }
    }

    if (this.state.systemType === "county") {
      if (this.state.county === "") {
        this.setState({ countyError: true });
        checkInputMessages.push("Enter a city");
        error = true;
      } else {
        this.setState({ countyError: false });
      }
    }

    if (this.state.systemType === "international") {
      if (this.state.country === "") {
        this.setState({ countryError: true });
        checkInputMessages.push("Enter a city");
        error = true;
      } else {
        this.setState({ countryError: false });
      }
    }

    this.setState({ checkInputMessages: checkInputMessages });
    return error;
  }

  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });
  handleCheckboxChange() {
    this.setState({showScreenName: !this.state.showScreenName});
  }

  handleSubmit(event) {
    event.preventDefault();
    let inputError = this.checkInputs();

    if (!inputError) {
      const system = (({
        name,
        shortName,
        description,
        systemType,
        city,
        state,
        county,
        country,
        showScreenName
      }) => ({
        name,
        shortName,
        description,
        systemType,
        city,
        state,
        county,
        country,
        showScreenName
      }))(this.state);
      this.props.onSubmit(system);
    }
  }

  render() {
    var requestMessage = "";
    var floatStyle = {
      overflow: "auto"
    };

    const { isEditing } = this.props;
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
      this.state.checkInputMessages.length ||
      this.props.requestMessage.length
    ) {
      var counter = 0;
      requestMessage = (
        <Message compact warning icon>
          <Icon name="lightning" />
          <Message.Content>
            <Message.Header>Problems...</Message.Header>
            <ul>
              {this.state.checkInputMessages.map(function(listValue) {
                return <li key={`ListItem_${counter++}`}>{listValue}</li>;
              })}
              {this.props.requestMessage.length > 0 && (
                <li key="req-mess">{this.props.requestMessage}</li>
              )}
            </ul>
          </Message.Content>
        </Message>
      );
    }
    return (
      <div>
        <Form className="raised padding segment" onSubmit={this.handleSubmit}>
          <Form.Group widths="equal">
            <Form.Field>
              <Form.Input
                type="text"
                name="name"
                onChange={this.handleInputChange}
                error={this.state.nameError}
                value={this.state.name}
                label="System name"
                placeholder="System Name..."
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                type="text"
                name="shortName"
                onChange={this.handleInputChange}
                error={this.state.shortNameError}
                value={this.state.shortName}
                disabled={isEditing}
                label="System Short Name (4-10 characters)"
                placeholder="Short Name..."
              />
            </Form.Field>
          </Form.Group>
          <Divider horizontal />
          <Form.Field>

            <p>Your Screen Name: {this.props.screenName}</p>
            <Checkbox
            onChange={this.handleCheckboxChange}
            checked={this.state.showScreenName}
            label="Show in System Listing" />

          </Form.Field>
          <Divider horizontal />
          <Form.TextArea
            label="Description"
            name="description"
            onChange={this.handleInputChange}
            error={this.state.descriptionError}
            value={this.state.description}
            rows={2}
            placeholder="Description of system..."
          />

          <Divider horizontal><Icon name="marker" />Location</Divider>
          <Form.Group inline>
            <label>System Type</label>
            <Form.Radio
              label="State"
              name="systemType"
              value="state"
              checked={this.state.systemType === "state"}
              onChange={this.handleInputChange}
            />
            <Form.Radio
              label="County"
              name="systemType"
              value="county"
              checked={this.state.systemType === "county"}
              onChange={this.handleInputChange}
            />
            <Form.Radio
              label="City"
              name="systemType"
              value="city"
              checked={this.state.systemType === "city"}
              onChange={this.handleInputChange}
            />
            <Form.Radio
              label="International"
              name="systemType"
              value="international"
              checked={this.state.systemType === "international"}
              onChange={this.handleInputChange}
            />
          </Form.Group>
          <Form.Group widths="equal">

              {this.state.systemType === "city" && (
                <Form.Field>
                <Form.Input
                  type="text"
                  name="city"
                  onChange={this.handleInputChange}
                  error={this.state.cityError}
                  value={this.state.city}
                  label="City"
                  placeholder="City..."
                />
              </Form.Field>
              )}
              {this.state.systemType === "county" && (
                <Form.Field>
                <Form.Input
                  type="text"
                  name="county"
                  onChange={this.handleInputChange}
                  error={this.state.countyError}
                  value={this.state.county}
                  label="County"
                  placeholder="County..."
                />
              </Form.Field>
              )}
              {this.state.systemType === "international" ? (
                <Form.Field>
                <Form.Input
                  type="text"
                  name="country"
                  onChange={this.handleInputChange}
                  error={this.state.countryError}
                  value={this.state.country}
                  label="Country"
                  placeholder="Country..."
                />
                </Form.Field>
              ) : (
                <Form.Field>
                <Form.Dropdown
                  name="state"
                  onChange={this.handleInputChange}
                  error={this.state.stateError}
                  value={this.state.state}
                  options={stateOptions}
                  label="State"
                  placeholder="Select State..."
                />
                </Form.Field>
              )}

          </Form.Group>

          <div style={floatStyle}>
            <Button type="submit" size="large" floated="right" value="Login">
              {isEditing != true ? "Create" : "Update"}
            </Button>
          </div>
        </Form>
        {requestMessage}
      </div>
    );
  }
}

export default SystemForm;
