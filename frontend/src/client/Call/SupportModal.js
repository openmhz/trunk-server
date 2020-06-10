import React, { Component } from "react";
import {
  Modal,
  Button,
  Icon,
  Dropdown
} from "semantic-ui-react";
import "./FilterModal.css";


class SupportModal extends Component {
  constructor(props) {
    super(props)
    this.handleDone = this.handleDone.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      open: false
    }
}


handleClose = () => this.props.onClose(false);

handleDone(event) {
    this.props.onClose();
}

  render() {
    return (

      <Modal open={this.props.open} onClose={this.handleClose} size='tiny' >
        <Modal.Header>Support OpenMHz</Modal.Header>
        <Modal.Content image>
        <Icon size='massive' name="coffee"/>
          <Modal.Description>
            <p>If OpenMHz brings you joy, think about becoming a supporter! It will cover hosting costs and help keep me focused on development.</p>
            <p>No worries if not, I am not having problems keeping it going.</p>
            <a href="https://github.com/sponsors/robotastic"><Button>
            Support
          </Button></a>
          </Modal.Description>

        </Modal.Content>
        <Modal.Actions>
        <Button onClick={this.handleDone} >
             Done
          </Button>
        </Modal.Actions>
      </Modal>

    )
  }
}

export default SupportModal;
