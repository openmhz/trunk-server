import React, { useState } from "react";
import { Link } from 'react-router-dom'
import { Container, Header, Divider, Icon, Menu, Button, List, ListContent, ListIcon, ListItem, ListDescription, ListHeader, LabelDetail } from "semantic-ui-react";


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
      title: { content: (<span style={{ fontWeight: "bold" }}>Where do the different feeds come from?</span>) },
      content: [
        'It is a team effort! There are contributers from around country and even internationally, that are running Trunk Recorder to capture local radio systems and sending the transmissions to OpenMHz.',
      ].join(' '),
    }
  ]


  return (
    <div>
      <Menu fixed="top">
        <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
        <Link to="/events"><Menu.Item link>Events</Menu.Item></Link>
        <Link to="/systems"><Menu.Item link>Listen</Menu.Item></Link>
        <Link to="/terms"><Menu.Item link>Terms of Service</Menu.Item></Link>
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
        <p> - Luke  </p>

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
        <List>
          <ListItem >
            <Icon name='help' />
            <ListContent>
              <ListHeader as="h2">Where do the different feeds come from</ListHeader>
              <ListDescription>
                It is a team effort! There are contributors from around country and even internationally, that are running <a href="https://github.com/robotastic/trunk-recorder">Trunk Recorder</a> to capture local radio systems and sending the transmissions to OpenMHz.
              </ListDescription>
            </ListContent>
          </ListItem>
          <ListItem >
            <Icon name='help' />
            <ListContent>
              <ListHeader as="h2">My favorite System has disappeared</ListHeader>
              <ListDescription>
                <p>
                  Since all of the system feed are contributed by the community, there is not much I can do to bring it back. Your best bet is to reach out to the contributor to check on the status of the feed.
                  Often times, the feed is just down for maintenance.</p>
                   <p>You can send a Message to the contributor by:</p>
                  <ul>
                    <li>going to <Link to="/systems">Systems</Link></li> 
                    <li>finding that system</li> 
                    <li>and clicking on the Message button</li>
                  </ul> 
                
                <p>If the System doesn't come back, think about running your own Trunk Recorder and contributing the feed to OpenMHz!</p>
              </ListDescription>
            </ListContent>
          </ListItem>
          <ListItem >
            <Icon name='help' />
            <ListContent>
              <ListHeader as="h2">Can I use audio from OpenMHz</ListHeader>
              <ListDescription>
                <p>Yes! You can use the audio from OpenMHz as long as you give credit to OpenMHz. You can't use the audio to misrepresent a situation or for any unlawful purpose.</p>
                <p><span style={{fontWeight: "bold"}}>BUT</span> - if lots of people are listening to the audio from your site, you should host the audio yourself and not use OpenMHz's infrastructure. Linking to the OpenMHz website is acceptable, linking directly to the audio files is not.</p>
              </ListDescription>
            </ListContent>
          </ListItem>
          <ListItem >
            <Icon name='help' />
            <ListContent>
              <ListHeader as="h2">Can I use OpenMHz's API</ListHeader>
              <ListDescription>
                <p>
                  <span style={{fontWeight: "bold"}}>Please don't</span> - the API is designed solely to support the OpenMHz website frontend and iOS app. The infrastructure for OpenMHz has not been well designed, and unauthorized use may result in the whole thing crashing.
                </p>
                <p>
                  Additionally, some API calls may place a significant load on the server, and preplanning is required to avoid this. In the future, I do want to create a public API that the community can use.
                </p>
              </ListDescription>
            </ListContent>
          </ListItem>
          <ListItem >
            <Icon name='help' />
            <ListContent>
              <ListHeader as="h2">I have other questions</ListHeader>
              <ListDescription>
                <p>
                  Check out the <Link to="/terms">Terms of Service</Link>, there might be an answer there or send me an email at <a href="mailto:luke@robotastic.com?Subject=OpenMHz" target="_top">luke@robotastic.com</a>
                </p>
              </ListDescription>
            </ListContent>
          </ListItem>
        </List>

        <Divider horizontal style={{ paddingTop: "4em", paddingBottom: "2em" }}><Header as="h2"><Icon name='bicycle' /></Header></Divider>
      </Container>
    </div>
  );
}


export default AboutComponent;