import React, { Component }  from "react"
import SystemForm from "./SystemForm";
import {
  Container,
  Header
} from "semantic-ui-react";

class EditSystem extends Component {
  constructor(props) {
    super(props);
    this.handleSystemSubmit = this.handleSystemSubmit.bind(this);
  }

  state = {
    requestMessage: ""
  }

  componentDidMount() {
     const { dispatch } = this.props
     this.props.fetchSystems()
   }

  handleSystemSubmit(system) {
    this.props
      .updateSystem(system)
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({
            requestMessage
          });
        } else {
            this.props.changeUrl("/system/"+system.shortName)
        }
      });
  }

	render() {
		return(
			<Container text>
        <Header as="h1">Update System</Header>
      <SystemForm onSubmit={this.handleSystemSubmit} system={this.props.system} isEditing={true} requestMessage={this.state.requestMessage} screenName={this.props.user.screenName}/>
			</Container>
		)
	}
}

export default EditSystem
