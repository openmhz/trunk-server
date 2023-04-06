import React, {  useState } from "react";
import SystemForm from "./SystemForm";
import {
  Container,
  Header
} from "semantic-ui-react";
import { useUpdateSystemMutation, useGetSystemsQuery, } from '../features/api/apiSlice'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom';

const UpdateSystem = (props) => {

  const { screenName } = useSelector((state) => state.user);
  const { shortName } = useParams();
  const { data: systemsData, isSuccess: isSystemsSuccess } = useGetSystemsQuery();
  const [updateSystem] = useUpdateSystemMutation();
  const [requestMessage, setRequestMessage] = useState("");

  const navigate = useNavigate();
  let system = false;
  if (isSystemsSuccess) {
    system = systemsData.systems.find(sys => sys.shortName === shortName);
  }


  const handleSystemSubmit = async (system) => {
    try {
      await updateSystem(system).unwrap();
      navigate("/system/" + shortName)
    } catch (error) {
      const message = error.data.message;
      console.log(message);
      setRequestMessage(message);
    }
  }


  return (
    <Container text>
      <Header as="h1">Update System</Header>
      <SystemForm onSubmit={handleSystemSubmit} system={system} isEditing={true} requestMessage={requestMessage} screenName={screenName} />
    </Container>
  )

}

export default UpdateSystem
