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
class ListPermissions extends Component {
  constructor(props) {
    super(props);

  }


//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const permissions = this.props.permissions;
    if (permissions) {
    return (

      <Table >
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Email</Table.HeaderCell>
      <Table.HeaderCell>Role</Table.HeaderCell>
      <Table.HeaderCell></Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {permissions.map((permission, i) => (
      <Table.Row key={ "Group-" + i}>
        <Table.Cell>{permission.firstName} {permission.lastName}</Table.Cell>
        <Table.Cell>{permission.email}</Table.Cell>
        <Table.Cell>{permission.role}</Table.Cell>
        <Table.Cell><Icon
        name="pencil alternate"
        link={true}
        onClick={e => this.props.updatePermission(permission._id)}
      />
      <Icon
        name="remove"
        link={true}
        onClick={e => this.props.deletePermission(permission)}
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

export default ListPermissions;
