import React, { Component } from "react";
import { Modal, Icon, Button, Header } from "semantic-ui-react";

class Message extends Component {
  constructor(props) {
    super(props);
  }

  _logout = event => {
    event.preventDefault();
    this.props.manualLogout();
  };

  render() {
    return (
      <Modal open={this.props.open} onClose={this.props.onClose} basic size="small">
        <Header icon="info" content={this.props.title} />
        <Modal.Content>
          <p>{this.props.message}</p>
        </Modal.Content>
        <Modal.Actions>
        <Button color='green' onClick={this.props.onClose} inverted>
          <Icon name='checkmark' /> Got it
        </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default Message;
