import {
    Container,
    Header,
    Card,
    Icon,
    Menu,
    Divider
  } from "semantic-ui-react";
  import { Link, useNavigate  } from 'react-router-dom'


  const NavBar = (props) => {

  
    const navigate = useNavigate();
      return (
          <Menu fixed="top">
            <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
            <Link to="/systems"><Menu.Item link>Systems</Menu.Item></Link>
            <Link to="/events"><Menu.Item link>Events</Menu.Item></Link>
            <Link to="/about"><Menu.Item link>About</Menu.Item></Link>
          </Menu>
      );
    }
  
  
  export default NavBar;