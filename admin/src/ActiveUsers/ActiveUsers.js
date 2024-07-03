import {
  Container,
  Header,
  Table,
  Icon
} from "semantic-ui-react";
import { useGetActiveUsersQuery, } from '../features/api/apiSlice'



// ----------------------------------------------------
const ActiveUsers = () => {
  const { data: users, isSuccess } = useGetActiveUsersQuery();


//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter

    return (
      <div>
        <Container>
          <Header as="h1">Email of Active Users</Header>


          <Header as="h3">List</Header>
          {users &&
            users.map((user) =>

            <span>{user.firstName} {user.lastName} &lt;{user.email}&gt;, </span>
          )}

          <Header as="h3">CSV</Header>

          First Name, Last Name, Email
          {users &&
            users.map((user) =>
           <span>{user.firstName}, {user.lastName}, {user.email} <br/></span>
          
          )}

        </Container>
      </div>
    );

}

export default ActiveUsers;
