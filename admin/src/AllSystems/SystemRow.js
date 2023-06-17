import {
    Container,
    Header,
    Table,
    Icon
  } from "semantic-ui-react";


  const SystemRow = (props) => {
    const { system } = props;
    var location = "";
    let lastActive = "";
    if (system.lastActive) {
        lastActive = new Date(system.lastActive).toLocaleDateString();
    }

    if (system) {
  
  
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
        default:
          location = "unknown";
      }
    }

    return (
        <Table.Row key={system.shortName}>
        <Table.Cell>{system.shortName}</Table.Cell>
        <Table.Cell>{system.name}</Table.Cell>
        <Table.Cell>{system.description}</Table.Cell>
        <Table.Cell>{location}</Table.Cell>
        <Table.Cell>{lastActive}</Table.Cell>
     </Table.Row>
    )
  }

  export default SystemRow;