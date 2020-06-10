import React, { Component } from "react";
import { Container, Header } from "semantic-ui-react";

var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";
var admin_email = process.env['ADMIN_EMAIL'] != null ? process.env['ADMIN_EMAIL'] : "luke@openmhz.com";

class About extends Component {


  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Container text>


                  <Header size='large'>Share the Air</Header>
                  <p>{site_name} makes it easy to share and archive recordings from <a href="https://github.com/robotastic/trunk-recorder">Trunk Recorder</a>.
                    Sharing access to these radio systems allows for other members of your community to follow local events.
                   Raising awareness of what our local fire, police and EMS have to go through everyday should
                      lead to greater appreciation for all the work they do that goes largely unseen.</p>
                    <p>Each of the radio systems comes from different contributers around the country. The different
                      systems may come and go as new ones are added and taken down. {site_name} only maintains the archive that
                      is available online.</p>








                    <p> - Luke  <a href="mailto:{admin_email}?Subject={site_name}" target="_top">{admin_email}</a>  </p>

      </Container>
    );
  }
}

export default About;
