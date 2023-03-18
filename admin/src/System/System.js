import React, { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import ListTalkgroups from "../Talkgroups/ListTalkgroups.js";
import MessageBox from "../Components/Message.js";
import ListGroups from "../Group/ListGroups.js";
import GroupModal from "../Group/GroupModalContainer.js";
import UpdatePermissionModal from "../Permission/UpdatePermissionModalContainer.js";
import AddPermissionModal from "../Permission/AddPermissionModalContainer.js";
import ErrorChart from "./ResponsiveErrorChart"
import CallChart from "./ResponsiveCallChart"
import { useGetSystemsQuery, useGetTalkgroupsQuery, useGetGroupsQuery, useGetErrorsQuery, useDeleteGroupMutation, useCreateGroupMutation, useSaveGroupOrderMutation } from '../features/api/apiSlice'
import {
  Button,
  Confirm,
  Icon,
  Form,
  TextArea,
  Header,
  Container,
  Message,
  List,
  Segment,
  Tab,
  Divider,
  Label
} from "semantic-ui-react";

const System = (props) => {
  const { shortName } = useParams();
  const { data: systemsData, isSuccess: isSystemsSuccess } = useGetSystemsQuery();
  const { data: talkgroupsData, isSuccess: isTalkgroupsSuccess } = useGetTalkgroupsQuery(shortName);
  const { data: groupsData, isSuccess: isGroupsSuccess } = useGetGroupsQuery(shortName);
  const { data: errorsData, isSuccess: isErrorsSuccess } = useGetErrorsQuery(shortName);
  const [deleteGroupAPI, { isLoading: isDeleting }] = useDeleteGroupMutation();
  const [reorderGroupsAPI, { isLoading: isReordering }] = useSaveGroupOrderMutation();
  const [openSystemDeleteConfirm, setOpenSystemDeleteConfirm] = useState(false);
  const [openPermissionDeleteConfirm, setOpenPermissionDeleteConfirm] = useState(false);
  const [openMessage, setOpenMessage] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [groupVisible, setGroupVisible] = useState(false);
  const [editGroupId, setEditGroupId] = useState(false);
  const [errorData, setErrorData] = useState({});
  const [callData, setCallData] = useState({});
  const [groupOrder, setGroupOrder] = useState([]);


  const processErrors = (errors) => {
    var allData = [];

    var num = 0;
    const now = new Date();
    var maxDate = now;
    var minDate = now;
    var minValue = 0;
    var maxValue = 0;
    var legend = [];
    for (var j = 0; j < errors.length; j++) {
      var data = [];
      for (var i = 0; i < errors[j].values.length; i++) {
        var time = new Date(errors[j].values[i].time);
        if (errors[j].values[i].errors > maxValue)
          maxValue = errors[j].values[i].errors;
        if (time < minDate) minDate = time;
        var value = {
          id: num++,
          y: errors[j].values[i].errors,
          x: time
        };
        data.push(value);
      }
      const id = Math.floor(errors[j]._id / 1000) / 1000 + "MHz";
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
    var errorTotals = [];
    const now = new Date();
    var maxDate = now;
    var minDate = now;
    var minValue = 0;
    var maxValue = 0;
    var MS_PER_MINUTE = 60000;
    for (var j = 0; j < statistic.callTotals.length; j++) {
      var spotsBack = statistic.callTotals.length - j;
      var time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
      if (time < minDate) minDate = time;
      if (statistic.callTotals[j] > maxValue)
        maxValue = statistic.callTotals[j];
      callTotals.push({ y: statistic.callTotals[j], x: time });
    }
    for (var j = 0; j < statistic.errorTotals.length; j++) {
      var spotsBack = statistic.errorTotals.length - j;
      var time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
      if (time < minDate) minDate = time;
      if (statistic.errorTotals[j] > maxValue)
        maxValue = statistic.errorTotals[j];
      errorTotals.push({ x: time, y: statistic.errorTotals[j] });
    }
    const callData = {
      minDate: minDate,
      maxDate: maxDate,
      minValue: minValue,
      maxValue: maxValue,
      callTotals: callTotals,
      errorTotals: errorTotals
    };

    setCallData(callData);
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
      if (groupsData[num]._id == groupId) {
        await deleteGroupAPI(groupsData[num])
      }
    }
  }

  const reorderGroup =  (oldIndex, newIndex) => {
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



  const handleExport = () => {
    /* this.props.talkgroupActions
       .exportTalkgroups(this.props.system.shortName)
       .then(requestMessage => {
         if (requestMessage) {
           // report to the user is there was a problem during registration
           this.setState({ requestMessage });
         }
       });*/
  }

  const saveGroupOrder = async () => {
    await reorderGroupsAPI({shortName: shortName, order: {groupOrder: JSON.stringify(groupOrder)}});

    /*const order = this.props.groups.map(x => x._id);
    const data = {
      groupOrder: JSON.stringify(order)
    };
    this.props.groupActions
      .saveGroupOrder(this.props.system.shortName, data)
      .then(requestMessage => {
        if (requestMessage) {
        }
      });*/
  }


  const handleUpload = (file) => {
    /*this.props.talkgroupActions
      .importTalkgroups(this.props.system.shortName, file)
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({ requestMessage });
        }
      });*/
  }



  const handleSystemDeleteConfirm = () => {
    setOpenSystemDeleteConfirm(false);
    /*
    this.props.systemActions
      .deleteSystem(this.props.system.shortName)
      .then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during login
          this.setState({ requestMessage: requestMessage, openMessage: true });
        }
      });*/
  };
  const handleSystemDeleteCancel = () => setOpenSystemDeleteConfirm(false);


  let system = false;
  if (isSystemsSuccess) {
    system = systemsData.systems.find(sys => sys.shortName == shortName);
  }

  useEffect(() => {
    if (groupsData) {
      let newOrder = [];
      groupsData.forEach(group => {

        newOrder.push(group._id);
      });
      setGroupOrder(newOrder);
    }
  }, [groupsData])

  useEffect(() => {
    if (isSystemsSuccess) {
      processStatistics(systemsData.stats[shortName])
    }
  }, [isSystemsSuccess]);

  useEffect(() => {
    if (isErrorsSuccess) {
      processErrors(errorData)
    }
  }, [isErrorsSuccess]);

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
                  <List.Header>Number</List.Header>
                  <List.Description>The talkgroup number</List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <List.Header>Mode</List.Header>
                  <List.Description>
                    The mode for the talkgroup, it can be: 'A' = analog, 'D' =
                    P25 Digital, 'E' = Encrypted
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <List.Header>Alpha</List.Header>
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
              <List.Item>
                <List.Content>
                  <List.Header>Tag</List.Header>
                  <List.Description>
                    The type of talkgroup, eg: Dispatch, Fireground
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <List.Header>Group</List.Header>
                  <List.Description>
                    The department that uses this talkgroup
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <List.Header>Priority</List.Header>
                  <List.Description>
                    The priority for recording this talkgroup, 100 or over
                    will be skipped
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
          <CallChart data={callData} />
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
