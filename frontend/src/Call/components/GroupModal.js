import React, { Component, useState } from "react";
import { useGetGroupsQuery } from '../../features/api/apiSlice'
import { setGroupFilter } from "../../features/callPlayer/callPlayerSlice";
import { useSelector, useDispatch } from 'react-redux'

import {
  Modal,
  Button,
  Icon,
  Dropdown
} from "semantic-ui-react";
import "./FilterModal.css";

function GroupModal (props) {
  const shortName = useSelector((state) => state.callPlayer.shortName);
  const { data, isError, isLoading, isSuccess,error } = useGetGroupsQuery(props.shortName);
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
      const obj = {
        key: group._id,
        value: group._id,
        text: group.groupName
      }
      groupOptions.push(obj);
    }
}


  return (

    <Modal open={props.open} onClose={onClose} size='tiny'>
   
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

export default GroupModal;
