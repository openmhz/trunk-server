import React, { Component } from "react";
import {
  Modal,
  Button,
  Icon,
  Dropdown
} from "semantic-ui-react";
import "./FilterModal.css";


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
}

export default GroupModal;
