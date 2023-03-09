import {useState} from 'react';
import {
  Modal,
  Button,
  Icon
} from "semantic-ui-react";
import "./FilterModal.css";


function SupportModal(props) {

  const [open, setOpen] = useState(false);

  const handleClose = () => props.onClose();

  return (
    <Modal open={open} onClose={() => setOpen(false)} onOpen={() => setOpen(true)} trigger={<div><Icon name="coffee" />Support OpenMHz</div>} size='tiny' >
      <Modal.Header>Support OpenMHz</Modal.Header>
      <Modal.Content image>
        <Icon size='massive' name="coffee" />
        <Modal.Description>
          <p>If OpenMHz brings you joy, think about becoming a supporter! It will cover hosting costs and help keep me focused on development.</p>
          <p>No worries if not, I am not having problems keeping it going.</p>
          <a href="https://github.com/sponsors/robotastic"><Button>
            Support
          </Button></a>
        </Modal.Description>

      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setOpen(false)} >
          Done
        </Button>
      </Modal.Actions>
    </Modal>

  )

}

export default SupportModal;
