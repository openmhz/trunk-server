import { Container, Header } from "semantic-ui-react";

const About = () => {



    return (
      <Container text>
        <Header size='large'>Share the Air</Header>
        <p>{process.env.REACT_APP_SITE_NAME} makes it easy to share and archive recordings from <a href="https://github.com/robotastic/trunk-recorder">Trunk Recorder</a>.
                    Sharing access to these radio systems allows for other members of your community to follow local events.
                   Raising awareness of what our local fire, police and EMS have to go through everyday should
                      lead to greater appreciation for all the work they do that goes largely unseen.</p>
        <p>Each of the radio systems comes from different contributers around the country. The different
                      systems may come and go as new ones are added and taken down. {process.env.REACT_APP_SITE_NAME} only maintains the archive that
                      is available online.</p>
        <p> - Luke  <a href="mailto:{process.env.REACT_APP_ADMIN_EMAIL}?Subject={process.env.REACT_APP_SITE_NAME}" target="_top">{process.env.REACT_APP_ADMIN_EMAIL}</a>  </p>
      </Container>
    );
  
}

export default About;
