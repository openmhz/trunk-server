import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Link } from 'react-router-dom'
import {
  Container,
  Header,
  Form,
  Grid,
  Segment,
  Input,
  Button,
  Message,
  Icon,
  Table
} from "semantic-ui-react";

// ----------------------------------------------------



// ----------------------------------------------------
class ListGroups extends Component {
  constructor(props) {
    super(props);

  }


//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const groups = this.props.groups;
    if (groups) {
    return (

      <Table >
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Talkgroup Count</Table.HeaderCell>
      <Table.HeaderCell></Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {groups.map((group, i) => (
      <Table.Row key={ "Group-" + i}>
        <Table.Cell>{group.groupName}</Table.Cell>
        <Table.Cell>{group.talkgroups.length}</Table.Cell>
        <Table.Cell>
          <Icon
          name="pencil alternate"
          link={true}
          onClick={e => this.props.editGroup(group._id)}
        /><Icon
          name="up arrow"
          link={true}
          onClick={e => this.props.reorderGroup(i, i-1)}
        /><Icon
          name="down arrow"
          link={true}
          onClick={e => this.props.reorderGroup(i, i+1)}
        /><Icon
          name="remove"
          link={true}
          onClick={e => this.props.deleteGroup(group._id)}
        />
        </Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>

    );
  } else {
    return (
      <div/>
    );
  }
}
}

export default ListGroups;
