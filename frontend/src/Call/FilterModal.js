import React, { Component } from "react";
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


class FilterModal extends Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.toggleStarred = this.toggleStarred.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      open: false,
      selectedTalkgroup: this.props.selectedTalkgroups,
      selectedGroup: this.props.selectedGroup,
      filterStarred: this.props.filterStarred,
      activeTab: this.props.activeTab
    }
}


handleTabChange = (e, data) => this.setState({activeTab: data.activeIndex});
handleInputChange = (e, { name, value }) => this.setState({ [name]: value });
toggleStarred = () => this.setState(prevState => ({ filterStarred: !prevState.filterStarred }));
handleClose = () => this.props.onClose(false);
handleDone(event) {
  switch(this.state.activeTab) {

    case 1:
      if (this.state.selectedGroup) {
        this.props.callActions.setGroupFilter(this.state.selectedGroup);
        this.props.onClose(true);
      } else {
        this.props.onClose(false);
      }
    break;
    case 2:
      if (this.state.selectedTalkgroup) {
        this.props.callActions.setTalkgroupFilter(this.state.selectedTalkgroup);
        this.props.onClose(true);
      } else {
        this.props.onClose(false);
      }
    break;
    default:
    case 0:
      this.props.callActions.setAllFilter();
      this.props.onClose(true);
    break;
  }
  if (this.state.filterStarred !== this.props.filterStarred) {
    this.props.callActions.setStarred(this.state.filterStarred);
    this.props.onClose(true);
  }
  
}
componentWillUpdate(nextProps) {

  const filterChanged = ((nextProps.selectedTalkgroups !== this.props.selectedTalkgroups) || (nextProps.selectedGroup !== this.props.selectedGroup));
  if (filterChanged) {
    this.setState({selectedTalkgroup: nextProps.selectedTalkgroups,  selectedGroup: nextProps.selectedGroup, activeTab: nextProps.activeTab});
  }
}

  render() {
    var obj;
    var talkgroupList = [];
    if (this.props.talkgroups) {
      for (const num in this.props.talkgroups) {
        const talkgroup = this.props.talkgroups[num];
        obj = {
          key: talkgroup.num,
          value: talkgroup.num,
          text: talkgroup.description
        }
        talkgroupList.push(obj);
      }
    }
    var groupList = [];
    if (this.props.groups) {
      for (const num in this.props.groups) {
        const group = this.props.groups[num];
        obj = {
          key: group._id,
          value: group._id,
          text: group.groupName
        }
        groupList.push(obj);
      }
    }
    const panes = [
  { menuItem: 'All', render: () =>
  { return (
    <Tab.Pane attached={false}>
    <Header>All Calls</Header>
   <p>Dispaly all of the calls.</p>
   </Tab.Pane>
    )}},
  { menuItem: 'Groups', render: () =>
  { return (
    <Tab.Pane attached={false}>
      <Dropdown placeholder='Groups' fluid selection options={groupList} value={this.state.selectedGroup} name='selectedGroup' onChange={this.handleInputChange} />

    </Tab.Pane>
  )} },
  { menuItem: 'Talkgroups', render: () =>
  { return (
    <Tab.Pane attached={false}>
     <Dropdown placeholder='Talkgroups' fluid multiple selection options={talkgroupList} value={this.state.selectedTalkgroup} name='selectedTalkgroup' onChange={this.handleInputChange} />
    </Tab.Pane>
  )} },
]
    return (

      <Modal open={this.props.open} onClose={this.handleClose} centered={false} size="tiny">
        <Modal.Header>Select a Filter</Modal.Header>
        <Modal.Content >
          <Modal.Description>
            <Tab menu={{ pointing: true }} panes={panes} defaultActiveIndex={this.props.activeTab} onTabChange={this.handleTabChange}/>
            <Divider/>
            <Checkbox label='Show only Starred calls'  checked={this.state.filterStarred} name='filterStarred' onChange={this.toggleStarred}/>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.handleDone} >
            <Icon name='checkmark' /> Done
          </Button>
        </Modal.Actions>
      </Modal>

    )
  }
}

export default FilterModal;
