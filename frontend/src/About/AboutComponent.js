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
      key: 'what-is-dog',
      title: 'What is a dog?',
      content: [
        'A dog is a type of domesticated animal. Known for its loyalty and faithfulness, it can be found as a welcome',
        'guest in many households across the world.',
      ].join(' '),
    },
    {
      key: 'kinds-of-dogs',
      title: 'What kinds of dogs are there?',
      content: [
        'There are many breeds of dogs. Each breed varies in size and temperament. Owners often select a breed of dog',
        'that they find to be compatible with their own lifestyle and desires from a companion.',
      ].join(' '),
    },
    {
      key: 'acquire-dog',
      title: 'How do you acquire a dog?',
      content: {
        content: (
          <div>
            <p>
              Three common ways for a prospective owner to acquire a dog is from
              pet shops, private owners, or shelters.
            </p>
            <p>
              A pet shop may be the most convenient way to buy a dog. Buying a dog
              from a private owner allows you to assess the pedigree and
              upbringing of your dog before choosing to take it home. Lastly,
              finding your dog from a shelter, helps give a good home to a dog who
              may not find one so readily.
            </p>
          </div>
        ),
      },
    },
  ]
  
  const AccordionExampleStandardShorthand = () => (
    <Accordion defaultActiveIndex={0} panels={panels} />
  )

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
      <Accordion fluid >
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          How do I create an Event?
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 0}>
          <p>
            A dog is a type of domesticated animal. Known for its loyalty and
            faithfulness, it can be found as a welcome guest in many households
            across the world.
          </p>
        </Accordion.Content>
        <Accordion.Title
          active={activeIndex === 1}
          index={1}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          <span style={{fontWeight: "bold"}}>How can I add a radio system?</span>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 1}>
          <p>
            A dog is a type of domesticated animal. Known for its loyalty and
            faithfulness, it can be found as a welcome guest in many households
            across the world.
          </p>
        </Accordion.Content>
        <Accordion.Title
          active={activeIndex === 2}
          index={2}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          <span style={{fontWeight: "bold"}}>Where do the different feeds come from?</span>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 2}>
          <p>
            It is a team effort! There are contributers from around country and even internationally, that are running Trunk Recorder to capture 
            local radio systems and sending the transmissions to OpenMHz.
          </p>
        </Accordion.Content>
        <Accordion.Title
          active={activeIndex === 3}
          index={3}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          <span style={{fontWeight: "bold"}}>Where do the different feeds come from?</span>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 3}>
          <p>
            It is a team effort! There are contributers from around country and even internationally, that are running Trunk Recorder to capture 
            local radio systems and sending the transmissions to OpenMHz.
          </p>
        </Accordion.Content>
      </Accordion>
      </Container>
    </div>
  );
}


export default AboutComponent;