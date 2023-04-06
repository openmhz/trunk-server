import {
  Icon,
  Table
} from "semantic-ui-react";

// ----------------------------------------------------



// ----------------------------------------------------
const ListGroups = (props) => {


//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter

    const groups = props.groups;
    let groupsDisplay = [];
    if (groups) {
      // if a group gets deleted, it will still be listed in the Order array for a little.
      for (const id of props.order) {
        const group = props.groups.find( group => group._id === id );
        if (group) {
          groupsDisplay.push(group)
        }
      }
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
    {groupsDisplay.map((group, i) => (
      
      <Table.Row key={ "Group-" + i}>
        <Table.Cell>{group.groupName}</Table.Cell>
        <Table.Cell>{group.talkgroups.length}</Table.Cell>
        <Table.Cell>
          <Icon
          name="pencil alternate"
          link={true}
          onClick={e => props.editGroup(group._id)}
        /><Icon
          name="up arrow"
          link={i===0?false:true}
          disabled={i===0?true:false}
          onClick={e => props.reorderGroup(i, i-1)}
        /><Icon
          name="down arrow"
          link={i===groupsDisplay.length-1?false:true}
          disabled={i===groupsDisplay.length-1?true:false}
          onClick={e => props.reorderGroup(i, i+1)}
        /><Icon
          name="remove"
          link={true}
          onClick={e => props.deleteGroup(group._id)}
        />
        </Table.Cell>
      </Table.Row>
      
    )
    )}
  </Table.Body>
</Table>

    );
  } else {
    return (
      <div/>
    );
  }
}

export default ListGroups;
