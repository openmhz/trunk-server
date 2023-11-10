import React, { useEffect, useLayoutEffect, useState } from "react";
import { Link, useParams, useNavigate } from 'react-router-dom';
import ListTalkgroups from "../Talkgroups/ListTalkgroups.js";
import MessageBox from "../Components/Message.js";
import ListGroups from "../Group/ListGroups.js";
import GroupModal from "../Group/GroupModal.js";
import ErrorChart from "./ResponsiveErrorChart"
import CallChart from "./ResponsiveCallChart"
import { useGetSystemsQuery, useGetTalkgroupsQuery, useGetGroupsQuery, useGetErrorsQuery, useDeleteGroupMutation, useDeleteSystemMutation, useImportTalkgroupsMutation, useSaveGroupOrderMutation } from '../features/api/apiSlice'
import {
  Button,
  Confirm,
  Icon,
  Form,
  TextArea,
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
  const { data: systemsData, isSuccess: isSystemsSuccess } = useGetSystemsQuery();
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  const { data: groupsData } = useGetGroupsQuery(shortName);
  //const { data: systemErrorData, isSuccess: isErrorsSuccess } = useGetErrorsQuery(shortName);
  const [deleteGroupAPI] = useDeleteGroupMutation();
  const [reorderGroupsAPI] = useSaveGroupOrderMutation();
  const [importTalkgroupsAPI, { error: importError }] = useImportTalkgroupsMutation();
  const [deleteSystemAPI ] = useDeleteSystemMutation();
  const [openSystemDeleteConfirm, setOpenSystemDeleteConfirm] = useState(false);
  const [openMessage, setOpenMessage] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [groupVisible, setGroupVisible] = useState(false);
  const [editGroupId, setEditGroupId] = useState(false);
  const [errorData, setErrorData] = useState({});
  const [callStatistics, setCallStatistics] = useState({});
  const [groupOrder, setGroupOrder] = useState([]);


  const processErrors = (statistics) => {
    const errors = statistics.decodeErrorsFreq;
    var allData = [];

    var num = 0;
    const now = new Date();
    var maxDate = now;
    var minDate = now;
    var minValue = 0;
    var maxValue = 0;
    var legend = [];
    var MS_PER_MINUTE = 60000;
    for (const freq in errors) {
      const freqErrors = errors[freq];
      var data = [];
      for (var i = 0; i < freqErrors.errorHistory.length; i++) {
        let spotsBack = i; //freqErrors.errorHistory.length - i;
        let time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
        if (time < minDate) minDate = time;
        
        if (freqErrors.errorHistory[i] > maxValue)
          maxValue = freqErrors.errorHistory[i];
        var value = {
          id: num++,
          y: freqErrors.errorHistory[i],
          x: time
        };
        data.push(value);
      }
      const id = Math.floor(freq / 1000) / 1000 + "MHz";
      legend.push(id);
      var obj = {
        id: id,
        data: data
      };
      allData.push(obj);
    }
    const errorData = {
      data: allData,
      minDate: minDate,
      maxDate: maxDate,
      minValue: minValue,
      maxValue: maxValue,
      legend: legend
    };

    setErrorData(errorData);
  };

  const processStatistics = (statistic) => {
    var callTotals = [];
    var uploadErrors= [];
    let talkgroupStats = [];
    let decodeErrorsFreq = [];

    const now = new Date();
    var maxDate = now;
    var minDate = now;
    var minValue = 0;
    var maxValue = 0;
    var MS_PER_MINUTE = 60000;
    if (statistic) {
      for (let j = 0; j < statistic.callTotals.length; j++) {
        let spotsBack = j;//statistic.callTotals.length - j;
        let time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
        if (time < minDate) minDate = time;
        if (statistic.callTotals[j] > maxValue)
          maxValue = statistic.callTotals[j];
        callTotals.push({ y: statistic.callTotals[j], x: time });
      }
      for (let j = 0; j < statistic.uploadErrors.length; j++) {
        let spotsBack = statistic.uploadErrors.length - j;
        let time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
        if (time < minDate) minDate = time;
        if (statistic.uploadErrors[j] > maxValue)
          maxValue = statistic.uploadErrors[j];
        uploadErrors.push({ x: time, y: statistic.uploadErrors[j] });
      }
      const data = {
        minDate: minDate,
        maxDate: maxDate,
        minValue: minValue,
        maxValue: maxValue,
        callTotals: callTotals,
        uploadErrors: uploadErrors
      };

      setCallStatistics(data);
    }
  }


  /*
    componentDidMount() {
      this.props.systemActions.fetchSystems();
      this.props.talkgroupActions.fetchTalkgroups(this.props.shortName);
      this.props.groupActions.fetchGroups(this.props.shortName);
      this.props.errorActions.fetch(this.props.shortName);
      if (this.props.statistic) {
        this.processStatistics(this.props.statistic);
      }
      if (this.props.errors) {
        this.processErrors(this.props.errors);
      }
    }
  
    componentDidUpdate(prevProp) {
  
      // If we just received the error statistics for a system, for the first time, proccess them.
      if (this.props.errors && !prevProp.errors) {
        this.processErrors(this.props.errors);
      }
      // If we just received the call statistics for a system, for the first time, proccess them.
      if (this.props.statistic && !prevProp.statistic) {
        this.processStatistics(this.props.statistic);
      }
    }
  */

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

  const handleUpload = async (file) => {
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
      const message = error.data.message;
      console.log(message);
      setRequestMessage(message);
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

  useEffect(() => {
    if (isSystemsSuccess && systemsData.stats[shortName]) {
      processStatistics(systemsData.stats[shortName])
      processErrors(systemsData.stats[shortName])
    }
  }, [isSystemsSuccess, systemsData]);
/*
  useEffect(() => {
    if (isErrorsSuccess) {
      processErrors(systemErrorData)
    }
  }, [systemErrorData]);*/

  let fileInput = null;
  var location = "";
  var example = "";
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


    example =
      '{\n\t"systems": [\n\t\t{\n\t\t\t"shortName": "' +
      system.shortName +
      '",\n\t\t\t"apiKey": "' +
      system.key +
      '"\n\t\t}\n\t],\n\t"uploadServer": "' +
      process.env.REACT_APP_BACKEND_SERVER +
      '"\n}';

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
                <Header size="small">Description</Header>
                {system.description}
              </Segment>

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
      menuItem: "Config",
      render: () => (
        <div>
          <Container text>
            <Header as="h2">Configure Trunk Recorder</Header>
            <p>
              Below are the parameters you will need to configure Trunk
              Recorder. The example below shows how they should be added to
              the config.json file.
            </p>

            <Segment.Group>
              <Segment>
                <Header size="small">API Key</Header>
                {system.key}
              </Segment>
              <Segment>
                <Header size="small">Short Name</Header>
                {system.shortName}
              </Segment>
              <Segment>
                <Header size="small">Upload Server</Header>
                {process.env.REACT_APP_BACKEND_SERVER}
              </Segment>
              <Segment>
                <Header size="small">Example</Header>
                <Form>
                  <TextArea rows="10" readOnly="readOnly" value={example} />
                </Form>
              </Segment>
            </Segment.Group>
          </Container>
        </div>
      )
    },
    {
      menuItem: "Talkgroups",
      render: () => (
        <div>
          <Container text>
            <p>
              <em>
                This is the same .csv talkgroup file from Trunk Recorder...
                except the Hex column has been deleted
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
                    Up to 12 charecter description of the talkgroup
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
            <label htmlFor="upload-button" className="ui icon button">
              <i className="upload icon" />
              Import Talkgroups
            </label>
            <input
              type="file"
              id="upload-button"
              style={{
                display: "none"
              }}
              onChange={() => {
                handleUpload(fileInput.files[0]);
              }}
              ref={input => {
                fileInput = input;
              }}
            />
          </span>
          <a href={"/talkgroups/" + system.shortName + "/export"}>
            <Button>
              <i className="upload icon" />
              Export Talkgroups
            </Button>
          </a>
          {importError ? (
            <div>
              <Message color='red'>{importError.data}</Message>
            </div>
          ) : (<div></div>)}
          
          <ListTalkgroups talkgroups={talkgroupsData} />
        </div>
      )
    },
    {
      menuItem: "Groups",
      render: groupRender
    }, {
      menuItem: "Stats",
      render: () => (
        <div>
          <Divider horizontal>
            <Icon name="microphone" />
            24-Hour Call History
          </Divider>
          <CallChart data={callStatistics} />
          <Divider horizontal>
            <Icon name="microphone" />
            Hourly Vocoder Error Percentage
          </Divider>
          <ErrorChart data={errorData} />
        </div>
      )
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
          //defaultActiveIndex={activeTab}
          />
        </Container>
      }
    </div>
  );
}


export default System;
