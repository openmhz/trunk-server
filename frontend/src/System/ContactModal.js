import {useState} from 'react';
import {
  Modal,
  Button,
  Icon,
  List,
  Form,
  Grid
} from "semantic-ui-react";
import { useContactSystemMutation } from '../features/api/apiSlice'

function ContactModal(props) {

  const [contactSystem, { isLoading }] = useContactSystemMutation()
  const {system, onClose} = props;
  const [email, setEmail] = useState(false);
  const [name, setName] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState(false);

  const handleSubmit = async () => {
    if ((!name || name.length < 3) || (!email || email.length < 3) || (!message || message.length < 3)) {
      setError("Please fill out your Name, Email and a Message with something useful");
    } else {

      const body = {
        name,
        email,
        message
      }
      try {
        const shortName = system.shortName;
        const returned = await contactSystem({body,shortName}).unwrap();
        console.log(returned);
        setName(false);
        setEmail(false);
        setMessage(false);
        onClose();
    } catch (submitError) {
        console.error(error)
        setError(submitError);
      // you can handle errors here if you want to
    }
      

    }
  }
  

  return (
    <Modal open={props.open} onClose={onClose} size='large' >
      <Modal.Header>Contact Feed Contributer</Modal.Header>
      <Modal.Content>
        <Modal.Description>
        <Grid columns={2} divided>
        <Grid.Row>
           <Grid.Column width={6}>
            <p>The radio systems on OpenMHz are contributed by people from around the world.</p> <p>Use this form to contact the contributer for the <span style={{fontWeight: "bold"}}>{system.name}</span> system regarding:
            <List as='ul'>
              <List.Item as='li'>Outages</List.Item>
              <List.Item as='li'>Audio quality</List.Item>
              <List.Item as='li'>Talkgroup updates</List.Item>
              <List.Item as='li'>Thanks & appreciation</List.Item>
            </List>
            </p>
            <p>If you have general questions about OpenMHz send me an email, </p>
            <p> - Luke  <a href="mailto:luke@robotastic.com?Subject=OpenMHz" target="_top">luke@robotastic.com</a>  </p>

            </Grid.Column>
            <Grid.Column width={10}>
              <Form>
              <Form.Group widths='equal'>
          <Form.Input fluid label='Name' placeholder='Name' onChange={e => setName(e.target.value)}/>
          <Form.Input fluid label='Email' placeholder='Email' onChange={e => setEmail(e.target.value)} />
              </Form.Group>
              <Form.TextArea label='Message' placeholder='Provide feedback to the Feed Contributer' onChange={e => setMessage(e.target.value)} />
              </Form>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
      <Button onClick={(e) => onClose()} >
          Cancel
        </Button>
        <Button onClick={(e) => {handleSubmit(); e.stopPropagation();}} >
          Send
        </Button>
      </Modal.Actions>
    </Modal>

  )

}

export default ContactModal;
