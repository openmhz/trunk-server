import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Menu, Dropdown } from "semantic-ui-react";

const navStyle = {
  marginBottom: "30px"
};
const blankStyle = {
  marginBottom: "50px"
};
class Navigation extends Component {
  constructor(props) {
    super(props);
    this._logout = this._logout.bind(this);
  }

  _logout = event => {
    event.preventDefault();
    this.props.manualLogout();
  };

  render() {
    var profileLink = account_server + "/profile";
    var billingLink = account_server + "/billing";
    return (
      <div>
        {this.props.user.authenticated ? (
          <Menu style={navStyle}>
              <Menu.Item name="systems" header>
                OpenMHz
              </Menu.Item>
            <Menu.Menu position="right">
              {/* <Link to="/update-plans">
                <Menu.Item name="systems">Update Plans</Menu.Item>
              </Link> */}
              <Dropdown item text={this.props.user.email}>
                <Dropdown.Menu>
                    <Dropdown.Item href={profileLink}>Profile</Dropdown.Item>
                    {/* <Dropdown.Item href={billingLink}>Billing</Dropdown.Item> */}
                    <Dropdown.Item onClick={this._logout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Menu>
          </Menu>
        ) : (
          <Menu style={navStyle}>
              <Menu.Item name="systems" header>
                OpenMHz
              </Menu.Item>
          </Menu>
        )}
      </div>
    );
  }
}

export default Navigation;
