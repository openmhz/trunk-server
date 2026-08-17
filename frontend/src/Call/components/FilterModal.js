import React, { useState, useEffect } from "react";
import { setGroupFilter, setTalkgroupFilter, setAllFilter, setStarredFilter, setQueryFilter } from "../../features/callPlayer/callPlayerSlice";
import { useGetGroupsQuery, useGetTalkgroupsQuery } from '../../features/api/apiSlice'
import { useSelector, useDispatch } from 'react-redux'
import { selectIsSupporter } from "../../features/user/userSlice";
import {
  Modal,
  Button,
  Icon,
  Tab,
  Header,
  Dropdown,
  Checkbox,
  Divider,
  Input,
  Form
} from "semantic-ui-react";
import "./FilterModal.css";


function FilterModal(props) {
  const globalFilterStarred = useSelector((state) => state.callPlayer.filterStarred);
  const globalFilterQuery = useSelector((state) => state.callPlayer.filterQuery);
  const isSupporter = useSelector(selectIsSupporter);
  const { data:groupsData, isSuccess:isGroupsSuccess } = useGetGroupsQuery(props.shortName);
  const { data:talkgroupsData, isSuccess:isTalkgroupsSuccess } = useGetTalkgroupsQuery(props.shortName);
  const [selectedTalkgroup, setSelectedTalkgroup] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(false);
  const [filterStarred, setFilterStarred] = useState(globalFilterStarred);
  const [searchText, setSearchText] = useState(globalFilterQuery || "");
  const [activeTab, setActiveTab] = useState(0);
  const dispatch = useDispatch()

  // Load the current filters in whenever the dialog is opened. Without this the
  // controls start from their defaults rather than from what is actually
  // applied, so opening the dialog with the starred filter on and pressing Done
  // silently turned it off - the checkbox said it was off, and Done believed
  // the checkbox.
  useEffect(() => {
    if (props.open) {
      setFilterStarred(globalFilterStarred);
      setSearchText(globalFilterQuery || "");
    }
  }, [props.open, globalFilterStarred, globalFilterQuery]);

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

    const nextQuery = searchText.trim();
    if ((globalFilterQuery || "") !== nextQuery) {
      dispatch(setQueryFilter(nextQuery));
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
            <p>Display all of the calls.</p>
          </Tab.Pane>
        )
      }
    },
    {
      menuItem: 'Groups', render: () => {
        return (
          <Tab.Pane attached={false}>
            <Dropdown placeholder='Groups' fluid search selection options={groupList} value={selectedGroup} name='selectedGroup' onChange={handleGroupChange} />

          </Tab.Pane>
        )
      }
    },
    {
      menuItem: 'Repeaters', render: () => {
        return (
          <Tab.Pane attached={false}>
            <Dropdown placeholder='Repeaters' fluid multiple search selection options={talkgroupList} value={selectedTalkgroup} name='selectedTalkgroup' onChange={handleTalkgroupChange} />
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

          {/* The player's top bar has a search box, but it is hidden below
              768px where there is no room for it. This is the way in on a
              phone. Shown on every width all the same: someone who opens a
              dialog called Filter reasonably expects every filter to be in it,
              and it also shows what search is currently applied. */}
          <Divider />
          <Form>
            <Form.Field>
              <label>Search transcripts</label>
              <Input
                icon={searchText ? <Icon name="close" link onClick={() => setSearchText("")} /> : <Icon name="search" />}
                placeholder={isSupporter ? "What was said" : "Supporters only"}
                value={searchText}
                onChange={(e, { value }) => setSearchText(value)}
                disabled={!isSupporter}
                fluid
              />
              <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: 'rgba(0,0,0,.5)' }}>
                {isSupporter
                  ? "Covers the last 30 days. Live calls pause while searching, since a call has to be transcribed before it can match."
                  : <>Transcript search is a Supporter feature. <a href={`${process.env.REACT_APP_ACCOUNT_SERVER}/profile`}>Become a Supporter</a>.</>}
              </div>
            </Form.Field>
          </Form>
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
