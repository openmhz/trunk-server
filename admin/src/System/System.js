import React, { useLayoutEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import ListTalkgroups from "../Talkgroups/ListTalkgroups.js";
import MessageBox from "../Components/Message.js";
import GetStarted from "./GetStarted.js";
import SystemStatus from "./SystemStatus.js";
import { getErrorMessage } from "../Components/helpers";
import ListGroups from "../Group/ListGroups.js";
import GroupModal from "../Group/GroupModal.js";
import { useGetSystemsQuery, useGetTalkgroupsQuery, useGetGroupsQuery, useDeleteGroupMutation, useDeleteSystemMutation, useImportTalkgroupsMutation, useSaveGroupOrderMutation } from '../features/api/apiSlice'
import {
  Button,
  Confirm,
  Message,
  Header,
  Container,
  List,
  Segment,
  Tab,
  Divider
} from "semantic-ui-react";

const System = () => {
  const { shortName } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const justCreated = Boolean(routeLocation.state && routeLocation.state.justCreated);
  const [activeTab, setActiveTab] = useState(justCreated ? 1 : 0);
  const { data: systemsData, isSuccess: isSystemsSuccess } = useGetSystemsQuery();
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  const { data: groupsData } = useGetGroupsQuery(shortName);
  const [deleteGroupAPI] = useDeleteGroupMutation();
  const [reorderGroupsAPI] = useSaveGroupOrderMutation();
  const [importTalkgroupsAPI, { error: importError, data: importResult, isLoading: isImporting }] = useImportTalkgroupsMutation();
  const [deleteSystemAPI ] = useDeleteSystemMutation();
  const [openSystemDeleteConfirm, setOpenSystemDeleteConfirm] = useState(false);
  const [openMessage, setOpenMessage] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [groupVisible, setGroupVisible] = useState(false);
  const [editGroupId, setEditGroupId] = useState(false);
  const [groupOrder, setGroupOrder] = useState([]);


  const editGroup = (groupId) => {
    setEditGroupId(groupId)
    setGroupVisible((state) => !state)
  }

  const deleteGroup = async (groupId) => {
    for (const num in groupsData) {
      if (groupsData[num]._id === groupId) {
        await deleteGroupAPI(groupsData[num])
      }
    }
  }

  const reorderGroup = (oldIndex, newIndex) => {
    if ((newIndex < 0) || (newIndex > (groupOrder.length - 1))) {
      return
    }
    const moveOrder = groupOrder.slice();
    moveOrder.splice(newIndex, 0, moveOrder.splice(oldIndex, 1)[0]);
    setGroupOrder(moveOrder);
  }

  const handleGroupClose = () => {
    setEditGroupId(false)
    setGroupVisible(false)
  }

  const handleGroupToggle = () => {
    setEditGroupId(false)
    setGroupVisible((state) => !state)
  }

  const saveGroupOrder = async () => {
    await reorderGroupsAPI({ shortName: shortName, order: { groupOrder: JSON.stringify(groupOrder) } });
  }

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    // reset so choosing the same file again fires onChange
    event.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file)
    await importTalkgroupsAPI({ shortName: shortName, file: formData });
  }



  const handleSystemDeleteConfirm = async () => {
    setOpenSystemDeleteConfirm(false);
    try {
      await deleteSystemAPI(shortName).unwrap();
      navigate("/list-systems")
    } catch (error) {
      const message = getErrorMessage(error);
      console.log(message);
      setRequestMessage(message);
      setOpenMessage(true);
    }

  };
  const handleSystemDeleteCancel = () => setOpenSystemDeleteConfirm(false);


  let system = false;
  if (isSystemsSuccess) {
    system = systemsData.systems.find(sys => sys.shortName === shortName);
  }

  useLayoutEffect(() => {
    if (groupsData) {
      let newOrder = [];
      groupsData.forEach(group => {

        newOrder.push(group._id);
      });
      setGroupOrder(newOrder);
    }
  }, [groupsData])
  var location = "";
  var groupRender = () => { };

  if (system) {
    if (isTalkgroupsSuccess && talkgroupsData.length) {
      groupRender = () => (
        <div>
          <Button onClick={handleGroupToggle}>Create Group</Button>
          <Button onClick={saveGroupOrder} > Save Order</Button>
          <ListGroups
            groups={groupsData}
            order={groupOrder}
            reorderGroup={reorderGroup}
            deleteGroup={deleteGroup}
            editGroup={editGroup}
          />
        </div>
      );
    } else {
      groupRender = () => (
        <Container text>
          <Message
            icon="upload"
            header="Import Talkgroups"
            content="Before you can create groups of Talkgroups, you need to import some talkgroups."
          />
        </Container>
      );
    }


    switch (system.systemType) {
      case "state":
        location = system.state;
        break;
      default:
      case "city":
        location = system.city + ", " + system.state;
        break;
      case "county":
        location = system.county + ", " + system.state;
        break;
      case "international":
        location = system.country;
        break;
    }
  }

  const panes = [
    {
      menuItem: "Overview",
      render: () => (
        <div>
          <Container text>
            <Segment.Group>
              <Segment>
                <Header size="small">Location</Header>
                {location}
              </Segment>
              <Segment>
                <Header size="small">Short Name</Header>
                {system.shortName}
              </Segment>
              <Segment>
                <Header size="small">Status</Header>
                <SystemStatus system={system} showLink />
              </Segment>
              <Segment>
                <Header size="small">Description</Header>
                {system.description}
              </Segment>
              {system.status &&
              <Segment>
                <Header size="small">Status Message</Header>
                {system.status}
              </Segment>
              }
              <Segment clearing={true}>
                <Button
                  color="red"
                  onClick={() => setOpenSystemDeleteConfirm(true)}
                  disabled={!isSystemsSuccess}
                  content="Delete"
                  floated="right"
                />
                <Button
                  as={Link}
                  to={"/update-system/" + system.shortName}
                  content="Update"
                  disabled={!isSystemsSuccess}
                  floated="left"
                />
              </Segment>
            </Segment.Group>
          </Container>
        </div>
      )
    },
    {
      menuItem: justCreated ? "Get started" : "Config",
      render: () => <GetStarted system={system} isNew={justCreated} />
    },
    {
      menuItem: "Talkgroups",
      render: () => (
        <div>
          <Container text>
            <p>
              <em>
                The Talkgroup file is a .CSV file that has information about the different talkgroups on the system. Headers are required for the columns, and should be the first
                line of the file. The columns can be in any order, but the headers must match exactly.<br/>
                <p>If you export the file from Excel, make sure to use "Comma Separated Values" and NOT "CSV UTF-8" for the File Format.</p>
                An example header line is: <br />
                <code>Decimal,Alpha Tag,Description</code><br/>
                <p>There can be additional columns so you can use the same Talkgroup CSV file from Trunk Recorder.</p>
              </em>
            </p>
            <p>The columns for the file are:</p>
            <List ordered celled>
              <List.Item>
                <List.Content>
                  <List.Header>Decimal</List.Header>
                  <List.Description>The talkgroup number in decimal</List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <List.Header>Alpha Tag</List.Header>
                  <List.Description>
                    Up to 12 character description of the talkgroup
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <List.Header>Description</List.Header>
                  <List.Description>
                    The full title for the talkgroup
                  </List.Description>
                </List.Content>
              </List.Item>
            </List>
          </Container>
          <Divider />
          <span>
            <label htmlFor="upload-button" className={"ui icon button" + (isImporting ? " loading disabled" : "")}>
              <i className="upload icon" />
              {isImporting ? "Importing..." : "Import Talkgroups"}
            </label>
            <input
              type="file"
              id="upload-button"
              style={{
                display: "none"
              }}
              disabled={isImporting}
              onChange={handleUpload}
            />
          </span>
          <a href={"/talkgroups/" + system.shortName + "/export"}>
            <Button>
              <i className="upload icon" />
              Export Talkgroups
            </Button>
          </a>
          {importError && (
            <Message color='red'>{getErrorMessage(importError)}</Message>
          )}
          {importResult && !isImporting && (
            <Message positive>
              Imported {importResult.imported} talkgroup{importResult.imported === 1 ? "" : "s"}
              {importResult.duplicates ? ` (${importResult.duplicates} duplicate${importResult.duplicates === 1 ? "" : "s"} skipped)` : ""}.
            </Message>
          )}
          
          <ListTalkgroups talkgroups={talkgroupsData} />
        </div>
      )
    },
    {
      menuItem: "Groups",
      render: groupRender
    }
  ];

  return (
    <div>


      <GroupModal
        shortName={shortName}
        editGroupId={editGroupId}
        open={groupVisible}
        onClose={handleGroupClose}
      />

      {system &&
        <Container>
          <MessageBox
            open={openMessage}
            message={requestMessage}
            title="Delete Failed"
            onClose={() => setOpenMessage(false)}
          />
          <Confirm
            open={openSystemDeleteConfirm}
            header="Are you sure you want to?"
            content={"Delete system - " + system.shortName}
            onCancel={handleSystemDeleteCancel}
            onConfirm={handleSystemDeleteConfirm}
          />
          <Header as="h1">
            <Header.Content>
              {system.name}
            </Header.Content>
          </Header>

          <Tab
            menu={{
              secondary: true,
              pointing: true
            }}
            panes={panes}
            activeIndex={activeTab}
            onTabChange={(e, data) => setActiveTab(data.activeIndex)}
          />
        </Container>
      }
    </div>
  );
}


export default System;
