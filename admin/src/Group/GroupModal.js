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
  const [group, setGroup] = useState(emptyGroup);
  const [talkgroupList, setTalkgroupList] = useState([]);

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
    setTalkgroupList(talkgroups);
    setGroupName(editGroup.groupName);
    }
  },[groupsData,talkgroupsData, props.editGroupId]);


  useEffect(() => {
    if (!props.editGroupId && talkgroupsData) {
      setTalkgroupList([...talkgroupsData]);
    }
  },[talkgroupsData, props.editGroupId]);

  const removeTalkgroup = (event, index) => {
    const item = group.items[index];
    if (!item) return;

    // Remove the item from the Group
    setGroup(prev => ({
      ...prev,
      items: prev.items.filter(tg => tg.num !== item.num)
    }));

    // Put the item back into the current list (not the full talkgroup list),
    // keeping it sorted and never duplicating an entry
    setTalkgroupList(prev => {
      if (prev.some(tg => tg.num === item.num)) return prev;
      const insertAt = prev.findIndex(tg => item.num < tg.num);
      const restored = { num: item.num, description: item.description };
      return insertAt === -1
        ? [...prev, restored]
        : [...prev.slice(0, insertAt), restored, ...prev.slice(insertAt)];
    });
  }


  const addTalkgroup = (event, index) => {
    const talkgroup = talkgroupList[index];
    if (!talkgroup) return;

    // Build a talkgroup item for the group based on the Index of the item from the list
    const item = {
      num: talkgroup.num,
      description: talkgroup.description
    };

    // Add item to the Group (functional updates so quick successive clicks aren't lost)
    setGroup(prev => (
      prev.items.some(tg => tg.num === item.num)
        ? prev
        : { ...prev, items: prev.items.concat(item) }
    ));

    // remove the item from the list
    setTalkgroupList(prev => prev.filter(tg => tg.num !== item.num));
  }

  const handleClose = () => {
    setGroupName("");
    setGroup(emptyGroup);
    setTalkgroupList([...talkgroupsData]);
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
      setTalkgroupList([...talkgroupsData]);
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
      setTalkgroupList([...talkgroupsData]);

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
                    {talkgroupList &&
                      talkgroupList.map((talkgroup, i) => (
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
