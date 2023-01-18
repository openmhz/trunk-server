import React, { useState } from "react";
import { useGetGroupsQuery } from '../features/api/apiSlice'
import { setGroupFilter } from "../features/callPlayer/callPlayerSlice";
import { useSelector, useDispatch } from 'react-redux'

import {
  Modal,
  Button,
  Icon,
  Dropdown
} from "semantic-ui-react";
import "./FilterModal.css";

function GroupModal (props) {
  const { data, isError, isLoading, isSuccess,error } = useGetGroupsQuery(props.shortName);
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(false);
  const dispatch = useDispatch()
  const onClose = props.onClose;

  function handleDone(onClose) {

    if (selectedGroup) {
      dispatch(setGroupFilter(selectedGroup))
      //dispatch({type: types.SET_GROUP_FILTER, groupId: selectedGroup  })
      onClose(true);
    } else {
      onClose(false);
    }
}  


  let groupOptions = []

  if (isSuccess) {

    for (const num in data) {
      const group = data[num];
      var obj = {
        key: group._id,
        value: group._id,
        text: group.groupName
      }
      groupOptions.push(obj);
    }
}


  return (

    <Modal open={props.open} onClose={() => setOpen(false)} onOpen={() => setOpen(true)} size='tiny'>
   
      <Modal.Header>Select a Group</Modal.Header>
      <Modal.Content >
        <Modal.Description>
          <p>Choose the type of calls you want to listen to</p>
          <Dropdown placeholder='Group...' fluid selection options={groupOptions}  name='selectedGroup' onChange={(e, data) => setSelectedGroup(data.value)} />

        </Modal.Description>

      </Modal.Content>
      <Modal.Actions>
        <Button onClick={()=> handleDone(onClose)} >
          <Icon name='headphones' /> Listen
        </Button>
      </Modal.Actions>
    </Modal>

  )
}
/*
class GroupModal extends Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      open: false,
      selectedGroup: false
    }
}


handleInputChange = (e, { name, value }) => this.setState({ [name]: value });
handleClose = () => this.props.onClose(false);

handleDone(event) {

      if (this.state.selectedGroup) {
        this.props.callActions.setGroupFilter(this.state.selectedGroup);
        this.props.onClose(true);
      } else {
        this.props.onClose(false);
      }

}  
componentDidUpdate(prevProps) {

  const filterChanged = (prevProps.selectedGroup !== this.props.selectedGroup);
  if (filterChanged) {
    this.setState({ selectedGroup: this.props.selectedGroup});
  }
}

  render() {


    var groupList = [];
    if (this.props.groups) {
      for (const num in this.props.groups) {
        const group = this.props.groups[num];
        var obj = {
          key: group._id,
          value: group._id,
          text: group.groupName
        }
        groupList.push(obj);
      }
    }

    return (

      <Modal open={this.props.open} onClose={this.handleClose} size='tiny' >
        <Modal.Header>Select a Group</Modal.Header>
        <Modal.Content >
          <Modal.Description>
            <p>Choose the type of calls you want to listen to</p>
            <Dropdown placeholder='Group...' fluid selection options={groupList}  name='selectedGroup' onChange={this.handleInputChange} />

          </Modal.Description>

        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.handleDone} >
            <Icon name='headphones' /> Listen
          </Button>
        </Modal.Actions>
      </Modal>

    )
  }
}*/

export default GroupModal;
