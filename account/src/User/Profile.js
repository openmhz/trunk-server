import React, { Component }  from "react"
import UserForm from "./UserForm";
import {
  Container,
  Header
} from "semantic-ui-react";

class Profile extends Component {
  constructor(props) {
    super(props);
    this.handleProfileSubmit = this.handleProfileSubmit.bind(this);
  }

  state = {
    requestMessage: ""
  }



  handleProfileSubmit(user) {
      user.userId = this.props.user.userId
      this.props
        .updateProfile(user)
        .then(requestMessage => {
          if (requestMessage) {
            // report to the user is there was a problem during registration
            this.setState({
              requestMessage
            });
          }
        });
  }

	render() {
    // The Key on UserForm get updated when the user is loaded. This forces the Component to be completely redrawn, otherwise the changes in the Prop are not copied to State.
		return(
			<Container text>
        <Header as="h1">Update Profile</Header>
      <UserForm onSubmit={this.handleProfileSubmit} user={this.props.user} isEditing={true} requestMessage={this.state.requestMessage} isWaiting={this.props.isWaiting} key={this.props.user.userId}/>
			</Container>
		)
	}
}

export default Profile
