import React, {Component} from "react";
import {Link} from "react-router-dom";
import ListTalkgroups from "../Talkgroups/ListTalkgroups.js";
import MessageBox from "../Components/Message.js";
import ListGroups from "../Group/ListGroups.js";
import GroupModal from "../Group/GroupModalContainer.js";
import UpdatePermissionModal from "../Permission/UpdatePermissionModalContainer.js";
import AddPermissionModal from "../Permission/AddPermissionModalContainer.js";
import ErrorChart from "./ResponsiveErrorChart"
import CallChart from "./ResponsiveCallChart"
import {
  Button,
  Confirm,
  Icon,
  Form,
  TextArea,
  Header,
  Container,
  Message,
  List,
  Segment,
  Tab,
  Divider,
  Label
} from "semantic-ui-react";


class System extends Component {
  constructor(props) {
    super(props);

    this.handleUpload = this.handleUpload.bind(this);
    this.reorderGroup = this.reorderGroup.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);
    this.editGroup = this.editGroup.bind(this);
    this.saveGroupOrder = this.saveGroupOrder.bind(this);
    this.showSystemDeleteConfirm = this.showSystemDeleteConfirm.bind(this);
    this.showPermissionDeleteConfirm = this.showPermissionDeleteConfirm.bind(
      this
    );
    this.updatePermission = this.updatePermission.bind(this);
    this.handlePermissionDeleteConfirm = this.handlePermissionDeleteConfirm.bind(
      this
    );
    this.handlePermissionDeleteCancel = this.handlePermissionDeleteCancel.bind(
      this
    );
    this.handleSystemDeleteConfirm = this.handleSystemDeleteConfirm.bind(this);
    this.handleSystemDeleteCancel = this.handleSystemDeleteCancel.bind(this);
    this.handleUpdatePermissionClose = this.handleUpdatePermissionClose.bind(
      this
    );
    this.handleGroupToggle = this.handleGroupToggle.bind(this);
    this.handleGroupClose = this.handleGroupClose.bind(this);
    this.handleAddPermissionToggle = this.handleAddPermissionToggle.bind(this);
    this.handleAddPermissionClose = this.handleAddPermissionClose.bind(this);
    this.processErrors = this.processErrors.bind(this);
    this.processStatistics = this.processStatistics.bind(this);
    this.state = {
      openSystemDeleteConfirm: false,
      openPermissionDeleteConfirm: false,
      openMessage: false,
      requestMessage: "",
      groupVisible: false,
      editGroupId: false,
      selectedPermission: false,
      addPermissionVisible: false,
      updatePermissionVisible: false,
      updatePermissionId: false
    };
  }

  processErrors(errors) {
    var allData = [];

    var num = 0;
    const now = new Date();
    var maxDate = now;
    var minDate = now;
    var minValue = 0;
    var maxValue = 0;
    var legend = [];
    for (var j = 0; j < errors.length; j++) {
      var data = [];
      for (var i = 0; i < errors[j].values.length; i++) {
        var time = new Date(errors[j].values[i].time);
        if (errors[j].values[i].errors > maxValue)
          maxValue = errors[j].values[i].errors;
        if (time < minDate) minDate = time;
        var value = {
          id: num++,
          y: errors[j].values[i].errors,
          x: time
        };
        data.push(value);
      }
      const id = Math.floor(errors[j]._id / 1000) / 1000 + "MHz";
      legend.push(id);
      var obj = {
        id: id,
        data: data
      };
      allData.push(obj);
    }
    const errorData = {
      data: allData,
      minDate: minDate,
      maxDate: maxDate,
      minValue: minValue,
      maxValue: maxValue,
      legend: legend
    };

    this.setState({ errorData: errorData });
  }
  processStatistics(statistic) {
    var callTotals = [];
    var errorTotals = [];
    const now = new Date();
    var maxDate = now;
    var minDate = now;
    var minValue = 0;
    var maxValue = 0;
    var MS_PER_MINUTE = 60000;
    for (var j = 0; j < statistic.callTotals.length; j++) {
      var spotsBack = statistic.callTotals.length - j;
      var time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
      if (time < minDate) minDate = time;
      if (statistic.callTotals[j] > maxValue)
        maxValue = statistic.callTotals[j];
      callTotals.push({ y: statistic.callTotals[j], x: time });
    }
    for (var j = 0; j < statistic.errorTotals.length; j++) {
      var spotsBack = statistic.errorTotals.length - j;
      var time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
      if (time < minDate) minDate = time;
      if (statistic.errorTotals[j] > maxValue)
        maxValue = statistic.errorTotals[j];
      errorTotals.push({ x: time, y: statistic.errorTotals[j] });
    }
    var callData = {
      minDate: minDate,
      maxDate: maxDate,
      minValue: minValue,
      maxValue: maxValue,
      callTotals: callTotals,
      errorTotals: errorTotals
    };

    this.setState({ callData: callData });
  }
  componentDidMount() {
    this.props.systemActions.fetchSystems();
    this.props.talkgroupActions.fetchTalkgroups(this.props.shortName);
    this.props.groupActions.fetchGroups(this.props.shortName);
    this.props.errorActions.fetch(this.props.shortName);
    this.props.permissionActions.fetch(this.props.shortName);
    if (this.props.statistic) {
      this.processStatistics(this.props.statistic);
    }
    if (this.props.errors) {
      this.processErrors(this.props.errors);
    }
  }

  componentWillReceiveProps(nextProp) {
    if (!this.props.errors && nextProp.errors) {
      this.processErrors(nextProp.errors);
    }
    if (!this.props.statistic && nextProp.statistic) {
      this.processStatistics(nextProp.statistic);
    }
  }

  updatePermission(permissionId) {
    this.setState({
      updatePermissionId: permissionId,
      updatePermissionVisible: !this.state.updatePermissionVisible
    });
  }

  editGroup(groupId) {
    this.setState({
      editGroupId: groupId,
      groupVisible: !this.state.groupVisible
    });
  }

  deleteGroup(groupId) {
    this.props.groupActions.deleteGroup(this.props.shortName, groupId);
  }

  reorderGroup(oldIndex, newIndex) {
    this.props.groupActions.reorderGroup(
      this.props.shortName,
      oldIndex,
      newIndex
    );
  }

  handleUpdatePermissionClose(didUpdate) {
    this.setState({
      updatePermissionVisible: !this.state.updatePermissionVisible,
      updatePermissionId: false
    });
  }

  handleAddPermissionClose(didUpdate) {
    this.setState({
      addPermissionVisible: !this.state.addPermissionVisible
    });
  }

  handleAddPermissionToggle = () =>
    this.setState({
      addPermissionVisible: !this.state.addPermissionVisible
    });

  handleGroupClose(didUpdate) {
    this.setState({
      groupVisible: !this.state.groupVisible,
      editGroupId: false
    });
  }
  handleGroupToggle = () => this.setState({
    editGroupId: false,
    groupVisible: !this.state.groupVisible
  })
  handleExport() {
    this.props.talkgroupActions
      .exportTalkgroups(this.props.system.shortName)
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({ requestMessage });
        }
      });
  }

  saveGroupOrder() {
    const order = this.props.groups.map(x => x._id);
    const data = {
      groupOrder: JSON.stringify(order)
    };
    this.props.groupActions
      .saveGroupOrder(this.props.system.shortName, data)
      .then(requestMessage => {
        if (requestMessage) {
        }
      });
  }


  handleUpload(file) {
    this.props.talkgroupActions
      .importTalkgroups(this.props.system.shortName, file)
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({ requestMessage });
        }
      });
  }

  // https://github.com/Semantic-Org/Semantic-UI-React/issues/2103

  showPermissionDeleteConfirm = permission =>
    this.setState({
      openPermissionDeleteConfirm: true,
      selectedPermission: permission
    });
  showSystemDeleteConfirm = () =>
    this.setState({ openSystemDeleteConfirm: true });

  handlePermissionDeleteConfirm = permissionId => {
    this.setState({ openPermissionDeleteConfirm: false });
    this.props.permissionActions
      .deletePermission({
        shortName: this.props.system.shortName,
        permissionId: this.state.selectedPermission._id
      })
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during login
          this.setState({ requestMessage: requestMessage, openMessage: true });
        }
      });
  };

  handleSystemDeleteConfirm = () => {
    this.setState({ openSystemDeleteConfirm: false });
    this.props.systemActions
      .deleteSystem(this.props.system.shortName)
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during login
          this.setState({ requestMessage: requestMessage, openMessage: true });
        }
      });
  };
  handleSystemDeleteCancel = () =>
    this.setState({ openSystemDeleteConfirm: false });
  handlePermissionDeleteCancel = () =>
    this.setState({ openPermissionDeleteConfirm: false });
  render() {
    const system = this.props.system;
    let fileInput = null;
    var location = "";
    var example = "";
    var groupRender = () => {};

    if (system) {
      if (this.props.talkgroups && this.props.talkgroups.length) {
        groupRender = () => (
          <div>
            <Button onClick={this.handleGroupToggle}>Create Group</Button>
            <Button onClick={this.saveGroupOrder} disabled={!this.props.orderChange}> Save Order</Button>
            <ListGroups
              groups={this.props.groups}
              reorderGroup={this.reorderGroup}
              deleteGroup={this.deleteGroup}
              editGroup={this.editGroup}
            />
          </div>
        );
      } else {
        groupRender = () => (
          <Container text>
            <Message
              icon="upload"
              header="Import Talkgroups"
              content="Before you can create groups of Talkgroups, you need to import some talkgroups."
            />
          </Container>
        );
      }


      example =
        '{\n\t"systems": [\n\t\t{\n\t\t\t"shortName": "' +
        system.shortName +
        '",\n\t\t\t"apiKey": "' +
        system.key +
        '"\n\t\t}\n\t],\n\t"uploadServer": "' +
        process.env.REACT_APP_BACKEND_SERVER +
        '"\n}';

      switch (system.systemType) {
        case "state":
          location = system.state;
          break;
        case "city":
          location = system.city + ", " + system.state;
          break;
        case "county":
          location = system.county + ", " + system.state;
          break;
        case "international":
          location = system.country;
          break;
      }
    }

    const panes = [
      {
        menuItem: "Overview",
        render: () => (
          <div>
            <Container text>
              <Segment.Group>
                <Segment>
                  <Header size="small">Location</Header>
                  {location}
                </Segment>
                <Segment>
                  <Header size="small">Short Name</Header>
                  {this.props.system.shortName}
                </Segment>
                <Segment>
                  <Header size="small">Description</Header>
                  {this.props.system.description}
                </Segment>

                <Segment clearing={true}>
                  <Button
                    color="red"
                    onClick={this.showSystemDeleteConfirm}
                    disabled={this.props.systemisWaiting}
                    content="Delete"
                    floated="right"
                  />
                  <Button
                    as={Link}
                    to={"/update-system/" + this.props.system.shortName}
                    content="Update"
                    disabled={this.props.systemisWaiting}
                    floated="left"
                  />
                </Segment>
              </Segment.Group>
            </Container>
          </div>
        )
      },
      {
        menuItem: "Config",
        render: () => (
          <div>
            <Container text>
              <Header as="h2">Configure Trunk Recorder</Header>
              <p>
                Below are the parameters you will need to configure Trunk
                Recorder. The example below shows how they should be added to
                the config.json file.
              </p>

              <Segment.Group>
                <Segment>
                  <Header size="small">API Key</Header>
                  {this.props.system.key}
                </Segment>
                <Segment>
                  <Header size="small">Short Name</Header>
                  {this.props.system.shortName}
                </Segment>
                <Segment>
                  <Header size="small">Upload Server</Header>
                  {process.env.REACT_APP_BACKEND_SERVER}
                </Segment>
                <Segment>
                  <Header size="small">Example</Header>
                  <Form>
                    <TextArea rows="10" readOnly="readOnly" value={example} />
                  </Form>
                </Segment>
              </Segment.Group>
            </Container>
          </div>
        )
      },
      {
        menuItem: "Talkgroups",
        render: () => (
          <div>
            <Container text>
              <p>
                <em>
                  This is the same .csv talkgroup file from Trunk Recorder...
                  except the Hex column has been deleted
                </em>
              </p>
              <p>The columns for the file are:</p>
              <List ordered celled>
                <List.Item>
                  <List.Content>
                    <List.Header>Number</List.Header>
                    <List.Description>The talkgroup number</List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <List.Header>Mode</List.Header>
                    <List.Description>
                      The mode for the talkgroup, it can be: 'A' = analog, 'D' =
                      P25 Digital, 'E' = Encrypted
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <List.Header>Alpha</List.Header>
                    <List.Description>
                      Up to 12 charecter description of the talkgroup
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <List.Header>Description</List.Header>
                    <List.Description>
                      The full title for the talkgroup
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <List.Header>Tag</List.Header>
                    <List.Description>
                      The type of talkgroup, eg: Dispatch, Fireground
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <List.Header>Group</List.Header>
                    <List.Description>
                      The department that uses this talkgroup
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <List.Header>Priority</List.Header>
                    <List.Description>
                      The priority for recording this talkgroup, 100 or over
                      will be skipped
                    </List.Description>
                  </List.Content>
                </List.Item>
              </List>
            </Container>
            <Divider />
            <span>
              <label htmlFor="upload-button" className="ui icon button">
                <i className="upload icon" />
                Import Talkgroups
              </label>
              <input
                type="file"
                id="upload-button"
                style={{
                  display: "none"
                }}
                onChange={() => {
                  this.handleUpload(fileInput.files[0]);
                }}
                ref={input => {
                  fileInput = input;
                }}
              />
            </span>
            <a href={"/talkgroups/" + this.props.system.shortName + "/export"}>
              <Button>
                <i className="upload icon" />
                Export Talkgroups
              </Button>
            </a>
            <ListTalkgroups talkgroups={this.props.talkgroups} />
          </div>
        )
      },
      {
        menuItem: "Groups",
        render: groupRender
      },
      /*{
        menuItem: "Users",
        render: () => (<Tab.Pane>





          <Button onClick={this.handleAddPermissionToggle} >
            Add User
          </Button>
          <ListPermissions permissions={this.props.permissions} updatePermission={this.updatePermission} deletePermission={this.showPermissionDeleteConfirm}/>
        </Tab.Pane>)
      },*/ {
        menuItem: "Stats",
        render: () => (
          <div>
            <Divider horizontal>
              <Icon name="microphone" />
              24-Hour Call History
            </Divider>
            <CallChart data={this.state.callData} />
            <Divider horizontal>
              <Icon name="microphone" />
              Hourly Vocoder Error Percentage
            </Divider>
            <ErrorChart data={this.state.errorData} />
          </div>
        )
      }
    ];

    return (
      <div>
        <AddPermissionModal
          shortName={this.props.shortName}
          open={this.state.addPermissionVisible}
          onClose={this.handleAddPermissionClose}
        />

        <GroupModal
          shortName={this.props.shortName}
          editGroupId={this.state.editGroupId}
          open={this.state.groupVisible}
          onClose={this.handleGroupClose}
        />
        <UpdatePermissionModal
          shortName={this.props.shortName}
          updatePermissionId={this.state.updatePermissionId}
          open={this.state.updatePermissionVisible}
          onClose={this.handleUpdatePermissionClose}
        />
        {system ? (
          <Container>
            <MessageBox
              open={this.state.openMessage}
              message={this.state.requestMessage}
              title="Delete Failed"
              onClose={() => this.setState({ openMessage: false })}
            />
            <Confirm
              open={this.state.openSystemDeleteConfirm}
              header="Are you sure you want to?"
              content={"Delete system - " + this.props.system.shortName}
              onCancel={this.handleSystemDeleteCancel}
              onConfirm={this.handleSystemDeleteConfirm}
            />
            <Confirm
              open={this.state.openPermissionDeleteConfirm}
              header="Are you sure you want to?"
              content={
                "Remove access for: " + this.state.selectedPermission.email
              }
              onCancel={this.handlePermissionDeleteCancel}
              onConfirm={this.handlePermissionDeleteConfirm}
            />

            <Header as="h1">
              <Header.Content>
                {this.props.system.name}
              </Header.Content>
            </Header>

            <Tab
              menu={{
                secondary: true,
                pointing: true
              }}
              panes={panes}
              defaultActiveIndex={this.props.activeTab}
            />
          </Container>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default System;
