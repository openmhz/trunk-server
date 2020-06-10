import React, { Component } from "react";
import { Link } from 'react-router-dom'
import { Container, Header, Divider, Icon, Menu } from "semantic-ui-react";

class About extends Component {
  constructor(props) {
    super(props);
  }



  render() {
    return (
      <div>
      <Menu fixed="top">
        <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
        <Link to="/systems"><Menu.Item link>Listen</Menu.Item></Link>
      </Menu>
      <Container text>
                  <Divider horizontal style={{paddingTop:"4em", paddingBottom:"2em"}}><Header as="h1">About<Icon name='compass' /></Header></Divider>

                  <p>I wrote <a href="https://github.com/robotastic/trunk-recorder">Trunk Recorder</a> because I was curious
                    about what my local fire station was up to and I put together the original version of OpenMHz because I
                    figured other people might want to listen to the recordings too.</p>
                    <p>The latest version of this site makes it easy for other people running Trunk Recorder to share their recrodings.
                      I am hoping that making it easier to listen to what our local fire, police and EMS have to go through everyday will
                      lead to greater appreciation for all the work they do that goes largely unseen. I am personally amazed by the numebr
                      of medical runs the DC's Fire and EMS department has to cover every day, and the shocking number of them that are ODs.</p>
                  <p>I will do my best to keep adding new features to this site. One thing I want to add is visualizations to make it easier to find interesting calls.
                    Let me know if you have any ideas.</p>
                  <p>Right now, each system will only have a 5 day archive. This is to help make sure things don't get overloaded and make sure I don't get a crazy bill
                    at the end of the month.</p>

                  <p> - Luke  <a href="mailto:admin@email.com?Subject=OpenMHz" target="_top">admin@email.com</a>  </p>

      </Container>
      </div>
    );
  }
}

export default About;
