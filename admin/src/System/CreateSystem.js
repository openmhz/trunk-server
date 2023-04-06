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

// ----------------------------------------------------
const CreateSystem = () => {
  const navigate = useNavigate();
  const [createSystem ] = useCreateSystemMutation();
  const { screenName } = useSelector((state) => state.user);

  const [requestMessage, setRequestMessage] = useState("");

  const handleSubmit = async (system) => {
      try {
        await createSystem(system).unwrap();
        navigate("/list-systems")
      } catch (error) {
        const message = error.data.message;
        console.log(message);
        setRequestMessage(message);
      }
  }

    return (
      <div>
        <Container text>
            <Header as="h2">Join Us!</Header>
            <p>
              Record the your community's radio systems and share them! All it
              takes is a spare computer and a cheap SDR. The software you need,
              along with an explanation of how to set it up, is available{" "}
              <a href="https://github.com/robotastic/trunk-recorder">here</a>.
              </p>
              <p>
              After you have the Trunk Recorder software up and running, come
              back here and sign-up for an account so you can share your
              recordings
            </p>
            <p> - Luke</p>
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
