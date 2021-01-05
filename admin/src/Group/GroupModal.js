import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  Container,
  Header,
  Form,
  Grid,
  Modal,
  Rail,
  Segment,
  List,
  Input,
  Button,
  Message,
  Icon,
  Table
} from "semantic-ui-react";

// ----------------------------------------------------
const requestMessageStyle = {
  color: "red"
};

// ----------------------------------------------------
class GroupModal extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);

    // Set initial state
    this.state = {
      editGroup: false,
      groupName: "",
      group: {
        name: "",
        items: []
      },
      talkgroups: this.props.talkgroups ? this.props.talkgroups : []
    };
  }

  componentDidMount() {
    //this.props.groupActions.fetchGroups(this.props.shortName);

    this.props.talkgroupActions.fetchTalkgroups(this.props.shortName);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.talkgroups && nextProps.groups && nextProps.editGroupId) {
      var editGroup = nextProps.groups.find(
        group => group._id === nextProps.editGroupId
      );
      var items = [];

      var talkgroups = nextProps.talkgroups;
      for (var i = 0; i < editGroup.talkgroups.length; i++) {
        const talkgroupId = editGroup.talkgroups[i];
        const index = talkgroups.findIndex(tg => tg.num === talkgroupId);
        if (index >= 0) {
          const item = {
            num: talkgroups[index].num,
            description: talkgroups[index].description
          };
          items.push(item);
          talkgroups = talkgroups
            .slice(0, index)
            .concat(talkgroups.slice(index + 1));
        }
      }
    const group = {name: editGroup.groupName, items: items}
    this.setState({group: group, talkgroups: talkgroups, groupName: editGroup.groupName});
  } else {
    this.setState({ talkgroups: nextProps.talkgroups })

  }

  if (!nextProps.editGroupId && (this.props.editGroupId != nextProps.editGroupId)) {
    this.setState({ groupName: "", group: {
      name: "",
      items: []
    }});
  }
  }

  removeTalkgroup(event, index) {
    const item = {
      num: this.state.group.items[index].num,
      description: this.state.group.items[index].description
    };

    const talkgroups = this.state.talkgroups.slice(0); // copy

    for (var i = 0, len = talkgroups.length; i < len; i++) {
      if (item.num < talkgroups[i].num) {
        talkgroups.splice(i, 0, item);
        break;
      }
    }
    this.setState({
      group: {
        items: this.state.group.items
          .slice(0, index)
          .concat(this.state.group.items.slice(index + 1))
      },
      talkgroups: talkgroups
    });
  }

  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });

  addTalkgroup(event, index) {
    const item = {
      num: this.state.talkgroups[index].num,
      description: this.state.talkgroups[index].description
    };

    this.setState({
      group: { items: this.state.group.items.concat(item) },
      talkgroups: this.state.talkgroups
        .slice(0, index)
        .concat(this.state.talkgroups.slice(index + 1))
    });
  }
  handleClose = () => this.props.onClose(false);
  handleSubmit() {
    var talkgroupNums = this.state.group.items.map(a => a.num);
    const data = {
      shortName: this.props.shortName,
      groupName: this.state.groupName,
      talkgroups: JSON.stringify(talkgroupNums)
    };
    if (this.props.editGroupId) {
      const data = {
        _id: this.props.editGroupId,
        shortName: this.props.shortName,
        groupName: this.state.groupName,
        talkgroups: JSON.stringify(talkgroupNums)
      };

      this.props.groupActions.updateGroup(data).then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({
            requestMessage
          });
          this.props.onClose(false);
        } else {
          this.props.onClose(true);
        }
      });
    } else {
      const data = {
        shortName: this.props.shortName,
        groupName: this.state.groupName,
        talkgroups: JSON.stringify(talkgroupNums)
      };

      this.props.groupActions.createGroup(data).then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({
            requestMessage
          });
          this.props.onClose(false);
        } else {
          this.props.onClose(true);
        }
      });
    }
  }

  render() {
    const talkgroups = this.state.talkgroups;
    const group = this.state.group.items;
    const railStyle = {
      top: "15px",
      minHeight: "200px"
    };
    return (
      <Modal open={this.props.open} onClose={this.handleClose} centered={false}>
        <Modal.Header>
          {this.props.editGroupId ? "Edit Group" : "Create Group"}
        </Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            <Grid container columns={2}>
              <Grid.Column>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Number</Table.HeaderCell>

                      <Table.HeaderCell>Description</Table.HeaderCell>
                      <Table.HeaderCell />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {talkgroups &&
                      talkgroups.map((talkgroup, i) => (
                        <Table.Row link="true" key={talkgroup.num + "-" + i}>
                          <Table.Cell>{talkgroup.num}</Table.Cell>

                          <Table.Cell>{talkgroup.description}</Table.Cell>
                          <Table.Cell>
                            <Icon
                              link
                              name="plus"
                              onClick={e => this.addTalkgroup(e, i)}
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table>
                <Rail position="right">
                  <Segment style={railStyle}>
                    <Input
                      name="groupName"
                      onChange={this.handleInputChange}
                      placeholder="Group Name"
                      value={this.state.groupName}
                    />
                    <List divided relaxed>
                      {group.map((talkgroup, i) => (
                        <List.Item key={"Group-" + i}>
                          <List.Icon
                            name="remove"
                            verticalAlign="middle"
                            link={true}
                            onClick={e => this.removeTalkgroup(e, i)}
                          />
                          <List.Content>{talkgroup.description}</List.Content>
                        </List.Item>
                      ))}
                    </List>
                    <Button onClick={this.handleSubmit}>
                      <Icon name="checkmark" />{" "}
                      {this.props.editGroupId ? "Update" : "Save"}
                    </Button>
                  </Segment>
                </Rail>
              </Grid.Column>
            </Grid>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.handleSubmit}>
            <Icon name="checkmark" />{" "}
            {this.props.editGroupId ? "Update" : "Save"}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default GroupModal;
