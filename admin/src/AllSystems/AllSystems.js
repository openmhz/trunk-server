import {
  Container,
  Divider,
  Header,
  Table
} from "semantic-ui-react";
import { useGetAllSystemsQuery, } from '../features/api/apiSlice'


// ----------------------------------------------------
const ListSystems = () => {
  const { data, isSuccess } = useGetAllSystemsQuery();
  let systems = false;
  if (isSuccess) {
    systems = data.systems;
  }

//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter

    return (
      <div>
        <Container>
          <Header as="h1">Radio Systems</Header>


          {systems &&
            systems.map((system) =>
            <Table celled selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>ShortName</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Last Active</Table.HeaderCell>
                <Table.HeaderCell>Owner</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
        
            <Table.Body>
              <Table.Row>
                <Table.Cell>{system.shortName}</Table.Cell>
                <Table.Cell>{system.name}</Table.Cell>
                <Table.Cell>{system.lastActive}</Table.Cell>
                <Table.Cell>{system.userId.firstName} {system.userId.lastName}</Table.Cell>
                <Table.Cell>{system.userId.email}</Table.Cell>
             </Table.Row>
             </Table.Body>
             </Table>
          )}

        </Container>
      </div>
    );

}

export default ListSystems;
