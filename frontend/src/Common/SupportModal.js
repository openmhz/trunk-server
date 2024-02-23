import {useState} from 'react';
import {
  Modal,
  Button,
  ButtonContent,
  ButtonGroup,
  Divider,
  Icon
} from "semantic-ui-react";


function SupportModal(props) {

  const [open, setOpen] = useState(false);

  const handleClose = () => props.onClose();

  return (
    <Modal open={open} onClose={() => setOpen(false)} onOpen={() => setOpen(true)} trigger={props.trigger} size='tiny' >
      <Modal.Header>Support OpenMHz</Modal.Header>
      <Modal.Content image>
        <Icon size='massive' name="coffee" />
        <Modal.Description>
          <p>If OpenMHz brings you joy, think about becoming a supporter! It will cover hosting costs and help keep me focused on development.</p>

          <Divider horizontal>Donate</Divider>
          <a href="https://github.com/sponsors/robotastic"><Button ><Icon name="github"/>GitHub Sponsors</Button></a>
          
          <a href="https://patreon.com/OpenMHz"><Button ><Icon name="patreon"/>Patreon </Button></a>

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
