import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom';
import React, { useState } from "react";
import {
  Header,
  Divider,
  List,
  ListItem,
  Segment,
  Statistic,
  Icon,
  Menu,
  Tab,
  Table,
  Modal,
  Button,
  Image,
  Form,
  Message
} from "semantic-ui-react";
import { useAddNewEventMutation, useGetTalkgroupsQuery } from '../../features/api/apiSlice'

function PlaylistBuilder(props) {
  const { shortName } = useParams();
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  const [addNewEvent, { isLoading }] = useAddNewEventMutation()
  const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);
  const [playlist, setPlaylist] = useState([]);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const handleTitleChange = (e, { name, value }) => setTitle(value);
  const handleDescriptionChange = (e, { name, value }) => setDescription(value);


  const compareCalls = (a, b) => {
    const aTimestamp = new Date(a.time).getTime()
    const bTimestamp = new Date(b.time).getTime()
    if (aTimestamp > bTimestamp) {
      return -1
    } else {
      return 1
    }
  }
  const addCall = (call) => {
    const found = playlist.find(c => c._id == call._id);
    if (!found) {
      playlist.push(call);
      setPlaylist([...playlist.sort(compareCalls)])
    }

  }

  const onDragOver = (event) => {
    // It also receives a DragEvent.
    // Later, we'll read the position
    // of the item from event.currentTarget
    // and store the updated list state

    // We need to prevent the default behavior
    // of this event, in order for the onDrop
    // event to fire.
    // It may sound weird, but the default is
    // to cancel out the drop.

    event.preventDefault();
  }


  const onDrop = (event) => {
    // Here, we will:
    // - update the rendered list
    // - and reset the DnD state
    var callId = event.dataTransfer.getData("call-id");
    console.log("Dropping: " + callId);
    addCall(callsData.entities[callId])
  }
  let listItems = "";

  listItems = playlist.map((call, index) => {
    let tgAlpha = call.talkgroupNum;
    if (talkgroupsData) {
      const talkgroup = talkgroupsData.talkgroups[call.talkgroupNum]
      tgAlpha = talkgroup.alpha?talkgroup.alpha:tgAlpha;
    }

    const time = new Date(call.time);
    const callTime = time.toLocaleTimeString();
    const callDate = time.toLocaleDateString();

    return ( <Table.Row key={index}>
      <Table.Cell>{call.len} </Table.Cell>
      <Table.Cell>{tgAlpha}</Table.Cell>
      <Table.Cell>{callTime}</Table.Cell>
    </Table.Row>
    )
  })

  const submitPlaylist = () => {
    setOpen(true)
  }

  const handleSubmit = () => {
    console.log(title)
    setOpen(false)
    const callIds = playlist.map( (call) => call._id)
    const event = {
      title,
      description,
      callIds
    }
   addNewEvent(event)
    setTitle("")
    setDescription("")
    setPlaylist([])
  }

  let content = (<Header as="h3" icon textAlign='center' style={{paddingTop: "3em"}}><Icon name='target' />Drag Calls Here</Header>)
  if (playlist.length > 0) {
    content = (<Table basic="very">
    <Table.Body>
    {listItems}
    </Table.Body>
  </Table>)
  }

  return (
    <>
        <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
    >
      <Modal.Header>Submit an Event</Modal.Header>
      <Modal.Content>
        
        <Modal.Description>
        <Message icon>
            <Icon name='warning sign' />
            <Message.Content>The Events feature is a work in progress! Things may break, change, or get deleted. Contact me with ideas or problems: luke@robotastic.com</Message.Content>
            </Message>
          <Header>Event</Header>
          <Form>
          
            <Form.Input
              name="title"
              value={title}
              label="Title"
              onChange={handleTitleChange}
              />
            <Form.TextArea
              name="description"
              value={description}
              label="Description"
              placeholder='Please describe the event'
              onChange={handleDescriptionChange}
              />
          </Form>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button color='black' onClick={() => setOpen(false)}>
          Nope
        </Button>
        <Button
          content="Submit"
          labelPosition='right'
          icon='checkmark'
          onClick={handleSubmit}
          positive
        />
      </Modal.Actions>
    </Modal>
      <Tab.Pane attached='bottom' onDragOver={onDragOver} onDrop={onDrop}>
        {content}
      </Tab.Pane>
      <Menu fluid widths={2}>
        <Menu.Item name="clear" onClick={() => setPlaylist([])}><Icon name='delete' />Clear</Menu.Item>
        <Menu.Item active name="submit" onClick={submitPlaylist}><Icon name="cloud upload" />Submit</Menu.Item>
      </Menu>
    </>
  )
}

export default PlaylistBuilder;