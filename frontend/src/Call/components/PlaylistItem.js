import React, { useState } from "react";
import {
  Table,
  Icon,
  Label
} from "semantic-ui-react";



const PlaylistItem = (props) => {
  const call = props.call;
  const tgAlpha = props.tgAlpha;
  const removeItem = props.removeItem;
  const index = props.index;
  const [removeVisible, setRemoveVisible] = useState(false);



  const handleRemoveClicked = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    removeItem(call);
  }

  let removeButton;




  if (removeVisible) {
    removeButton = <Icon name='delete' color="red"/>
  } else {
    removeButton = <Icon name='delete' color="grey"/>
  }



  const time = new Date(call.time);
  const callTime = time.toLocaleTimeString();
  return (
    <Table.Row key={index} onClick={(e) => props.onClick({ call: call }, e)}>
      <Table.Cell>{call.len} </Table.Cell>
      <Table.Cell>{tgAlpha}</Table.Cell>
      <Table.Cell>{callTime}</Table.Cell>
      <Table.Cell onMouseEnter={() => setRemoveVisible(true)} onMouseLeave={() => setRemoveVisible(false)} onClick={handleRemoveClicked}>{removeButton}</Table.Cell>
    </Table.Row>


  );
}

export default PlaylistItem;
