import React, { useEffect, useState, } from "react";
import { useGetTalkgroupsQuery, useGetGroupsQuery, useUpdateGroupMutation, useCreateGroupMutation} from '../features/api/apiSlice'

import {
  Grid,
  Modal,
  Rail,
  Segment,
  List,
  Input,
  Button,
  Icon,
  Table
} from "semantic-ui-react";


// ----------------------------------------------------
const GroupModal = (props) => {

  const emptyGroup = {
    name: "",
    items: []
  }

  const [groupName, setGroupName] = useState("");
  const [group, setGroup] = useState(emptyGroup)
  const [talkgroups, setTalkgroups] = useState(props.talkgroups ? props.talkgroups : [])

  const { data: talkgroupsData} = useGetTalkgroupsQuery(props.shortName);
  const { data: groupsData} = useGetGroupsQuery(props.shortName);
  const [ updateGroup] = useUpdateGroupMutation();
  const [ createGroup] = useCreateGroupMutation();

  useEffect(() => {
    if (talkgroupsData && groupsData && props.editGroupId) {
    let editGroup = groupsData.find(
      group => group._id === props.editGroupId
    );
    let items = [];

    let talkgroups = talkgroupsData.slice(0); //copy
    for (var i = 0; i < editGroup.talkgroups.length; i++) {
      const talkgroupNum = editGroup.talkgroups[i];
      const index = talkgroups.findIndex(tg => tg.num === talkgroupNum);
      if (index >= 0) {
        const item = {
          num: talkgroups[index].num,
          description: talkgroups[index].description
        };
        items.push(item);
        talkgroups = talkgroups
          .slice(0, index)
          .concat(talkgroups.slice(index + 1));
      }
    }
    // we want to remove that are part of the Group from the list on the Left
    const group = { name: editGroup.groupName, items: items }
    setGroup(group);
    setTalkgroups(talkgroups);
    setGroupName(editGroup.groupName);
    }
  },[groupsData,talkgroupsData, props.editGroupId]);


  useEffect(() => {
    if (!props.editGroupId && talkgroupsData) {
      setTalkgroups([...talkgroupsData]);
    }
  },[talkgroupsData, props.editGroupId]);


  useEffect(() => {
    if (!props.editGroupId && props.talkgroups) {
      setGroupName("");
      setGroup(emptyGroup);
      setTalkgroups( [...props.talkgroups]);
    }
  },[props.editGroupId, props.talkgroups]);

  const removeTalkgroup =  (index) => {
    const item = {
      num: group.items[index].num,
      description: group.items[index].description
    };

    let talkgroups = talkgroupsData.slice(0); // copy

    for (var i = 0, len = talkgroups.length; i < len; i++) {
      if (item.num < talkgroups[i].num) {
        talkgroups.splice(i, 0, item);
        break;
      }
    }
    setGroup( {
      items: this.state.group.items
        .slice(0, index)
        .concat(this.state.group.items.slice(index + 1))
    });
    setTalkgroups(talkgroups);
  }


  const addTalkgroup = (event, index) => {
    const item = {
      num: talkgroupsData[index].num,
      description: talkgroupsData[index].description
    };

    setGroup({ items: group.items.concat(item) })
    setTalkgroups(talkgroups.slice(0, index).concat(talkgroups.slice(index + 1)));
  }

  const handleClose = () => {
    setGroupName("");
    setGroup(emptyGroup);
    setTalkgroups([...talkgroupsData]);
    props.onClose();
  }

  const handleSubmit = async () => {
    const talkgroupNums = group.items.map(a => a.num);

    if (props.editGroupId) {
      const data = {
        _id: props.editGroupId,
        shortName: props.shortName,
        groupName: groupName,
        talkgroups: JSON.stringify(talkgroupNums)
      };

      setGroupName("");
      setGroup(emptyGroup);
      setTalkgroups([...talkgroupsData]);
      await updateGroup(data);
      props.onClose(true);
    } else {
      const data = {
        shortName: props.shortName,
        groupName: groupName,
        talkgroups: JSON.stringify(talkgroupNums)
      };

      setGroupName("");
      setGroup(emptyGroup);
      setTalkgroups([...talkgroupsData]);

      await createGroup(data);
      props.onClose();

    }
  }



    const railStyle = {
      top: "15px",
      minHeight: "200px"
    };
    return (
      <Modal open={props.open} onClose={handleClose} centered={false}>
        <Modal.Header>
          {props.editGroupId ? "Edit Group" : "Create Group"}
        </Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            <Grid container columns={2}>
              <Grid.Column>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Number</Table.HeaderCell>

                      <Table.HeaderCell>Description</Table.HeaderCell>
                      <Table.HeaderCell />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {talkgroups &&
                      talkgroups.map((talkgroup, i) => (
                        <Table.Row link="true" key={talkgroup.num + "-" + i}>
                          <Table.Cell>{talkgroup.num}</Table.Cell>

                          <Table.Cell>{talkgroup.description}</Table.Cell>
                          <Table.Cell>
                            <Icon
                              link
                              name="plus"
                              onClick={e => addTalkgroup(e, i)}
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table>
                <Rail position="right">
                  <Segment style={railStyle}>
                    <Input
                      name="groupName"
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="Group Name"
                      value={groupName}
                    />
                    <List divided relaxed>
                      {group.items.map((talkgroup, i) => (
                        <List.Item key={"Group-" + i}>
                          <List.Icon
                            name="remove"
                            verticalAlign="middle"
                            link={true}
                            onClick={e => removeTalkgroup(e, i)}
                          />
                          <List.Content>{talkgroup.description}</List.Content>
                        </List.Item>
                      ))}
                    </List>
                    <Button onClick={handleSubmit}>
                      <Icon name="checkmark" />{" "}
                      {props.editGroupId ? "Update" : "Save"}
                    </Button>
                  </Segment>
                </Rail>
              </Grid.Column>
            </Grid>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={handleSubmit}>
            <Icon name="checkmark" />{" "}
            {props.editGroupId ? "Update" : "Save"}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

export default GroupModal;
