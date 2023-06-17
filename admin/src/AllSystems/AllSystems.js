import {
  Container,
  Header,
  Table,
  Icon
} from "semantic-ui-react";
import { useGetAllSystemsQuery, } from '../features/api/apiSlice'
import SystemRow from "./SystemRow";


// ----------------------------------------------------
const AllSystems = () => {
  const { data: users, isSuccess } = useGetAllSystemsQuery();


//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter

    return (
      <div>
        <Container>
          <Header as="h1">Radio Systems</Header>


          {users &&
            users.map((user) =>

            <Container key={user.email}>
                <Header as='h2'>
                  <Icon name='user' />
                  <Header.Content>
                      {user.firstName} {user.lastName}
                    <Header.Subheader><a href={`mailto:${user.email}`}>{user.email}</a></Header.Subheader>
                  </Header.Content>
                </Header>
              <Table celled selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>ShortName</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell>Last Active</Table.HeaderCell>

              </Table.Row>
            </Table.Header>
            <Table.Body>
              {user.systems &&
                user.systems.map((system) =>
                <SystemRow key={system.shortName} system={system}/>
            )}
              </Table.Body>
              </Table>
             </Container>
          )}

        </Container>
      </div>
    );

}

export default AllSystems;
