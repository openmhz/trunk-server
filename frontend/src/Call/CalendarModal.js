import React, { Component } from "react";
import {
  Modal,
  Button,
  Icon,
  Header
} from "semantic-ui-react";
import "./CalendarModal.css";
import DatePicker from 'react-datepicker';
import {  subDays } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css';

class CalendarModal extends Component {
  constructor(props) {
    super(props)
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      open: false,
      startDate: new Date()
    }
}

handleDateChange = (date) => {
    this.setState({
      startDate: date
    });
  }

handleClose = () => this.props.onClose(false);
handleDone(event) {
  this.props.callActions.setDateFilter(this.state.startDate.getTime());
  this.props.onClose(true);
}


  render() {
    
    return (

      <Modal open={this.props.open} onClose={this.handleClose} centered={false} size="tiny">
        <Modal.Header>Select a Date & Time</Modal.Header>
        <Modal.Content >
          <Modal.Description>
            <DatePicker
                selected={this.state.startDate}
                onChange={this.handleDateChange}
                maxDate={new Date()}
                minDate={subDays(new Date(), process.env.REACT_APP_ARCHIVE_DAYS)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="LLL"
                inline
            />
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

export default CalendarModal;
