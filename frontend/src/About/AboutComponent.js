import React, {useState} from "react";
import { Link } from 'react-router-dom'
import { Container, Header, Divider, Icon, Menu, Button,  Accordion, } from "semantic-ui-react";


const AboutComponent = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const handleClick = (e, titleProps) => {
    const { index } = titleProps
    const newIndex = activeIndex === index ? -1 : index
    setActiveIndex(newIndex);
  }

  const panels = [
    {
      key: 'feeds',
      title: {content: (<span style={{fontWeight: "bold"}}>Where do the different feeds come from?</span>)},
      content: [
        'It is a team effort! There are contributers from around country and even internationally, that are running Trunk Recorder to capture local radio systems and sending the transmissions to OpenMHz.',
      ].join(' '),
    }
  ]
  

  return (
    <div>
      <Menu fixed="top">
        <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
        <Link to="/systems"><Menu.Item link>Listen</Menu.Item></Link>
      </Menu>
      <Container text>
        <Divider horizontal style={{ paddingTop: "4em", paddingBottom: "2em" }}><Header as="h1">About</Header></Divider>

        <p>I wrote <a href="https://github.com/robotastic/trunk-recorder">Trunk Recorder</a> because I was curious
          about what my local fire station was up to and I put together the original version of OpenMHz because I
          figured other people might want to listen to the recordings too.</p>
        <p>The latest version of this site makes it easy for other people running Trunk Recorder to share their recordings.
          I am hoping that making it easier to listen to what our local fire, police and EMS have to go through everyday will
          lead to a greater appreciation for all the work they do, which goes largely unseen.</p>

        <p>The audio from each system is archived for 30 days, so you can go back and listen to events you may have missed.</p>
        <p> - Luke  <a href="mailto:luke@robotastic.com?Subject=OpenMHz" target="_top">luke@robotastic.com</a>  </p>

        <Divider horizontal style={{ paddingTop: "4em", paddingBottom: "2em" }}><Header as="h2">100% Open Source</Header></Divider>
        <p>Have changes you would like to suggest? Want to run your own server for your community? All of the code for OpenMHz is available as open source:</p>
        <p><a href="https://github.com/openmhz/trunk-server"><Icon name='github' />Trunk Server</a></p>
        <Divider horizontal style={{ paddingTop: "4em", paddingBottom: "2em" }}><Header as="h2">Support</Header></Divider>
        <p>If OpenMHz brings you joy, think about becoming a supporter! It will cover hosting costs and help keep me focused on development.</p>

        <p><a href="https://github.com/sponsors/robotastic"><Button color='green'>
        <Icon name='heart' /> 
          Support
        </Button></a></p>

        <Divider horizontal style={{ paddingTop: "4em", paddingBottom: "2em" }}><Header as="h2">FAQ</Header></Divider>
        <Accordion defaultActiveIndex={0} panels={panels} />
        <Divider/>
      </Container>
    </div>
  );
}


export default AboutComponent;