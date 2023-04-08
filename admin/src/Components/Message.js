import React from "react";
import { Modal, Icon, Button, Header } from "semantic-ui-react";

const Message = (props) => {

  return (
    <Modal open={props.open} onClose={props.onClose} basic size="small">
      <Header icon="info" content={props.title} />
      <Modal.Content>
        <p>{props.message}</p>
      </Modal.Content>
      <Modal.Actions>
        <Button color='green' onClick={props.onClose} inverted>
          <Icon name='checkmark' /> Got it
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default Message;
