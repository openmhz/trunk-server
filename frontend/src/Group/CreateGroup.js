import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  Container,
  Header,
  Form,
  Grid,
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
class CreateGroup extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);

    // Set initial state
    this.state = {
      groupName: "",
      group: {
        name: "",
        items: []
      },
      talkgroups: (this.props.talkgroups ? this.props.talkgroups : [])
    };
  }

  componentDidMount() {
    //this.props.groupActions.fetchGroups(this.props.shortName);

    this.props.talkgroupActions.fetchTalkgroups(this.props.shortName);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ talkgroups: nextProps.talkgroups });
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
      group: { items: this.state.group.items
        .slice(0, index)
        .concat(this.state.group.items.slice(index + 1))},
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
  handleSubmit() {
    var talkgroupNums = this.state.group.items.map(a => a.num);
    const data = {shortName: this.props.shortName, groupName: this.state.groupName, talkgroups: JSON.stringify(talkgroupNums) }
    this.props.groupActions.createGroup(data).then(requestMessage => {
      if (requestMessage) {
        // report to the user is there was a problem during registration
        this.setState({
          requestMessage
        });
      } else {
        this.props.groupActions.changeUrl("/system/" + this.props.shortName + "/2");
      }
    });
  }

  render() {
    const talkgroups = this.state.talkgroups;
    const group = this.state.group.items;
    const railStyle = {
      top: "15px",
      minHeight: "200px"
    };
    return (
      <div>
      {talkgroups.length ? (
        <Container text>
        <Message
        icon='upload'
        header='Import Talkgroups'
        content='Before you can create groups of Talkgroups, you need to import some talkgroups.'
      />
      </Container>
      ) : (
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
              {talkgroups.map((talkgroup, i) => (
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
              <Input action={{ onClick: this.handleSubmit, content: 'Save' }} name="groupName" onChange={this.handleInputChange} placeholder="Group Name" />
              <List divided relaxed>
                {group.map((talkgroup, i) => (
                  <List.Item key={"Group-" + i}>
                    <List.Icon
                      name="remove"
                      verticalAlign="middle"
                      link={true}
                      onClick={e => this.removeTalkgroup(e, i)}
                    />
                    <List.Content>
                      {talkgroup.description}

                    </List.Content>
                  </List.Item>
                ))}
              </List>
            </Segment>
          </Rail>
        </Grid.Column>
      </Grid>
      )}
</div>
    );
  }
}

export default CreateGroup;
