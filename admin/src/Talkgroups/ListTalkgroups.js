import React, { Component } from "react";
import {
  Table
} from "semantic-ui-react";

// ----------------------------------------------------



// ----------------------------------------------------
class ListTalkgroups extends Component {

//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const talkgroups = this.props.talkgroups;
    if (talkgroups) {
    return (

      <Table celled>
  <Table.Header>
    <Table.Row>

      <Table.HeaderCell>Decimal</Table.HeaderCell>
      <Table.HeaderCell>Alpha Tag</Table.HeaderCell>
      <Table.HeaderCell>Description</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {talkgroups.map((talkgroup, i) => (
      <Table.Row key={talkgroup.num + "-" + i}>
        <Table.Cell>{talkgroup.num}</Table.Cell>
        <Table.Cell>{talkgroup.alpha}</Table.Cell>
        <Table.Cell>{talkgroup.description}</Table.Cell>
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

export default ListTalkgroups;
