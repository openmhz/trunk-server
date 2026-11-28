import React, {   useState } from "react";

import {
  Container,
  Header,
  Divider,
} from "semantic-ui-react";
import {  useCreateSystemMutation} from '../features/api/apiSlice'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import SystemForm from "./SystemForm";
import { getErrorMessage, TRUNK_RECORDER_URL } from "../Components/helpers";

// ----------------------------------------------------
const CreateSystem = () => {
  const navigate = useNavigate();
  const [createSystem ] = useCreateSystemMutation();
  const { screenName } = useSelector((state) => state.user);

  const [requestMessage, setRequestMessage] = useState("");

  const handleSubmit = async (system) => {
      try {
        const newSystem = await createSystem(system).unwrap();
        navigate("/system/" + newSystem.shortName, { state: { justCreated: true } })
      } catch (error) {
        const message = getErrorMessage(error);
        console.log(message);
        setRequestMessage(message);
      }
  }

    return (
      <div>
        <Container text>
            <Header as="h2">Add your radio system</Header>
            <p>
              Record your community's radio systems and share them! All it
              takes is a spare computer and a cheap SDR. The software you need,
              along with an explanation of how to set it up, is available{" "}
              <a href={TRUNK_RECORDER_URL} target="_blank" rel="noopener noreferrer">here</a>.
            </p>
            <p>
              Fill in the details below to create your system. On the next
              page you will get the API key and the settings to paste into
              Trunk Recorder so it can start sharing your recordings.
            </p>
        <Divider />
        <p></p>
        </Container>

        <Container text>
          <Header as="h1">Create System</Header>
          <SystemForm onSubmit={handleSubmit} requestMessage={requestMessage} screenName={screenName}/>
        </Container>
      </div>
    );
  
}

export default CreateSystem;
