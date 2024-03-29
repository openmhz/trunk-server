import { Link } from "react-router-dom";
import { Menu, Dropdown } from "semantic-ui-react";
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from "../features/user/userSlice";

const navStyle = {
  marginBottom: "30px"
};

const Navigation = (props) => {
  const dispatch = useDispatch();
  const { email, admin } = useSelector((state) => state.user);

  const logout = event => {
    event.preventDefault();
    dispatch(logoutUser({}));
  };

  var profileLink = process.env.REACT_APP_ACCOUNT_SERVER + "/profile";
  return (
    <div>
      <Menu style={navStyle}>
        <Menu.Item name="systems" header>
          {process.env.REACT_APP_SITE_NAME}
        </Menu.Item>
        <Menu.Menu position="right">
          {admin &&
          <Link to="/active-users">
            <Menu.Item name="active-users">Active Users</Menu.Item>
          </Link> }
          {admin &&
          <Link to="/all-systems">
            <Menu.Item name="all-systems">All Systems</Menu.Item>
          </Link>          
          }
          <Link to="/list-systems">
            <Menu.Item name="systems"> Systems</Menu.Item>
          </Link>
          <Link to="/about">
            <Menu.Item name="about">About</Menu.Item>
          </Link>
          <Dropdown item text={ email }>
            <Dropdown.Menu>
              <Dropdown.Item href={profileLink}>Profile</Dropdown.Item>
              <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
    </div>
  );
}


export default Navigation;
