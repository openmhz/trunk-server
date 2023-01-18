import React, { useState } from "react";
import {
  Modal,
  Button,
  Icon
} from "semantic-ui-react";
import "./CalendarModal.css";
import { setDateFilter } from "../features/callPlayer/callPlayerSlice";
import DatePicker from 'react-datepicker';
import { useDispatch } from 'react-redux'
import { subDays } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css';

function CalendarModal(props) {
  const [startDate, setStartDate] = useState(new Date());
  const dispatch = useDispatch()
  const onClose = props.onClose;

  const handleDateChange = (date) => {
    setStartDate(date);
  }

  const handleClose = () => this.props.onClose(false);
  const handleDone = (onClose) => {
    dispatch(setDateFilter(startDate.getTime()));
    onClose(true);
  }




  return (

    <Modal open={props.open} onClose={handleClose} centered={false} size="tiny">
      <Modal.Header>Select a Date & Time</Modal.Header>
      <Modal.Content >
        <Modal.Description>
          <DatePicker
            selected={startDate}
            onChange={handleDateChange}
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
        <Button onClick={()=>handleDone(onClose)} >
          <Icon name='checkmark' /> Done
        </Button>
      </Modal.Actions>
    </Modal>

  )
}


export default CalendarModal;
