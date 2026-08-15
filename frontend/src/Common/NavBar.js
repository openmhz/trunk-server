import {
    Icon,
    Menu
  } from "semantic-ui-react";
  import { Link } from 'react-router-dom'
  import AccountMenu from "./AccountMenu"


  const NavBar = (props) => {
      return (
          <Menu fixed="top">
            <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
            <Link to="/systems"><Menu.Item link>Systems</Menu.Item></Link>
            <Link to="/about"><Menu.Item link>About</Menu.Item></Link>
            <Menu.Menu position="right">
              <AccountMenu />
            </Menu.Menu>
          </Menu>
      );
    }


  export default NavBar;
