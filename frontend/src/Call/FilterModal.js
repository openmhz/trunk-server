import React, { useState } from "react";
import { setGroupFilter, setTalkgroupFilter, setAllFilter, setStarredFilter } from "../features/callPlayer/callPlayerSlice";
import { useGetGroupsQuery, useGetTalkgroupsQuery } from '../features/api/apiSlice'
import { useSelector, useDispatch } from 'react-redux'
import {
  Modal,
  Button,
  Icon,
  Tab,
  Header,
  Dropdown,
  Checkbox,
  Divider
} from "semantic-ui-react";
import "./FilterModal.css";


function FilterModal(props) {
  const globalFilterStarred = useSelector((state) => state.callPlayer.filterStarred);
  const { data:groupsData, isSuccess:isGroupsSuccess } = useGetGroupsQuery(props.shortName);
  const { data:talkgroupsData, isSuccess:isTalkgroupsSuccess } = useGetTalkgroupsQuery(props.shortName);
  const [selectedTalkgroup, setSelectedTalkgroup] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const dispatch = useDispatch()

  const handleTabChange = (e, data) => setActiveTab(data.activeIndex);
  const handleGroupChange = (e, { name, value }) => setSelectedGroup(value);
  const handleTalkgroupChange = (e, { name, value }) => setSelectedTalkgroup(value);
  const toggleStarred = () => setFilterStarred(!filterStarred);
  const handleClose = () => props.onClose(false);
  const onClose = props.onClose;

  function handleDone(onClose) {
    switch (activeTab) {

      case 1:
        if (selectedGroup) {
          dispatch(setGroupFilter(selectedGroup));
          props.onClose(true);
        } else {
          props.onClose(false);
        }
        break;
      case 2:
        if (selectedTalkgroup) {
          dispatch(setTalkgroupFilter(selectedTalkgroup))
          props.onClose(true);
        } else {
          props.onClose(false);
        }
        break;
      default:
      case 0:
        dispatch(setAllFilter());
        props.onClose(true);
        break;
    }
    if (globalFilterStarred !== filterStarred) {
      dispatch(setStarredFilter(filterStarred));
    }

  }


  
  let talkgroupList = [];
  if (isTalkgroupsSuccess) {
    for (const num in talkgroupsData["talkgroups"]) {
      const talkgroup = talkgroupsData["talkgroups"][num];
      const obj = {
        key: talkgroup.num,
        value: talkgroup.num,
        text: talkgroup.description
      }
      talkgroupList.push(obj);
    }
  }

  let groupList = [];
  if (isGroupsSuccess) {
    for (const num in groupsData) {
      const group = groupsData[num]
      const obj = {
        key: group._id,
        value: group._id,
        text: group.groupName
      }
      groupList.push(obj);
    }
  }
  
  const panes = [
    {
      menuItem: 'All', render: () => {
        return (
          <Tab.Pane attached={false}>
            <Header>All Calls</Header>
            <p>Dispaly all of the calls.</p>
          </Tab.Pane>
        )
      }
    },
    {
      menuItem: 'Groups', render: () => {
        return (
          <Tab.Pane attached={false}>
            <Dropdown placeholder='Groups' fluid selection options={groupList} value={selectedGroup} name='selectedGroup' onChange={handleGroupChange} />

          </Tab.Pane>
        )
      }
    },
    {
      menuItem: 'Talkgroups', render: () => {
        return (
          <Tab.Pane attached={false}>
            <Dropdown placeholder='Talkgroups' fluid multiple selection options={talkgroupList} value={selectedTalkgroup} name='selectedTalkgroup' onChange={handleTalkgroupChange} />
          </Tab.Pane>
        )
      }
    },
  ]
  return (

    <Modal open={props.open} onClose={handleClose} centered={false} size="tiny">
      <Modal.Header>Select a Filter</Modal.Header>
      <Modal.Content >
        <Modal.Description>
          <Tab menu={{ pointing: true }} panes={panes} defaultActiveIndex={activeTab} onTabChange={handleTabChange} />
          <Divider />
          <Checkbox label='Show only Starred calls' checked={filterStarred} name='filterStarred' onChange={toggleStarred} />
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={()=> handleDone(onClose)} >
          <Icon name='checkmark' /> Done
        </Button>
      </Modal.Actions>
    </Modal>

  )
}

export default FilterModal;
