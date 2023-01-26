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
import { setPlaylist, addToPlaylist, removeFromPLaylist } from '../../features/callPlayer/callPlayerSlice';
import PlaylistItem from "./PlaylistItem"

function PlaylistBuilder(props) {
  const { shortName } = useParams();
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  const [addNewEvent, { isLoading }] = useAddNewEventMutation()
  const { loading: callsLoading, data: callsData } = useSelector((state) => state.calls);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const handleTitleChange = (e, { name, value }) => setTitle(value);
  const handleDescriptionChange = (e, { name, value }) => setDescription(value);
  const playlist = useSelector((state) => state.callPlayer.playlist);

  const dispatch = useDispatch();




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

  const removeItem = (call) => {
    dispatch(removeFromPLaylist(call))
  }

  const onDrop = (event) => {
    // Here, we will:
    // - update the rendered list
    // - and reset the DnD state
    var callId = event.dataTransfer.getData("call-id");
    console.log("Dropping: " + callId);
    dispatch(addToPlaylist(callsData.entities[callId]))
  }



  let listItems = "";

  listItems = playlist.map((call, index) => {
    let tgAlpha = call.talkgroupNum;
    if (talkgroupsData) {
      const talkgroup = talkgroupsData.talkgroups[call.talkgroupNum]
      if (talkgroup && talkgroup.alpha!=" ") {
      tgAlpha = talkgroup.alpha;
      }
    }

    return (<PlaylistItem call={call} tgAlpha={tgAlpha} index={index} removeItem={removeItem} />)
  })

  const submitPlaylist = () => {
    setOpen(true)
  }

  const handleSubmit = () => {
    setOpen(false)
    const callIds = playlist.map((call) => call._id)
    const event = {
      title,
      description,
      callIds
    }
    addNewEvent(event);
    setTitle("");
    setDescription("");
    dispatch(setPlaylist([]));
  }

  let content = (<Header as="h3" icon textAlign='center' style={{ paddingTop: "3em" }}><Icon name='target' />Drag Calls Here</Header>)
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
      <Tab.Pane attached='bottom' onDragOver={onDragOver} onDrop={onDrop} style={{ overflowY: "auto", height: 300 }}>
        {content}
      </Tab.Pane>
      <Menu fluid widths={2}>
        <Menu.Item name="clear" onClick={() => dispatch(setPlaylist([]))}><Icon name='delete' />Clear</Menu.Item>
        <Menu.Item active name="submit" onClick={submitPlaylist}><Icon name="cloud upload" />Submit</Menu.Item>
      </Menu>
    </>
  )
}

export default PlaylistBuilder;