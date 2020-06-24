import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Link } from 'react-router-dom'
import SystemCard from "../System/SystemCard";
import "./Main.css";
import {
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  List,
  Menu,
  Responsive,
  Segment,
  Sidebar,
  Transition,
  Visibility,

} from 'semantic-ui-react'

/* eslint-disable react/no-multi-comp */
/* Heads up! HomepageHeading uses inline styling, however it's not the best practice. Use CSS or styled components for
 * such things.
 */
const HomepageHeading = ({ mobile }) => (
  <Container text style={{paddingBottom: '0px'}} >
    <Header
      as='h1'
      content='Share the Air'
      style={{
        fontSize: mobile ? '2em' : '4em',
        color: "#FFF",
        fontWeight: 'normal',
        marginBottom: 0,
        marginTop: mobile ? '1.5em' : '0em',
      }}
    />
    <Header
      as='h2'
      content='Listen to Police and Fire radio from across the US'
      style={{
        fontSize: mobile ? '1.5em' : '1.7em',
        color: "#FFF",
        fontWeight: 'normal',
        marginTop: mobile ? '0.5em' : '1.5em',
        marginBottom: mobile ? '0.5em' : '0em',
      }}
    />
  </Container>
)

var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";

/*
HomepageHeading.propTypes = {
  mobile: PropTypes.bool,
}
*/
/* Heads up!
 * Neither Semantic UI nor Semantic UI React offer a responsive navbar, however, it can be implemented easily.
 * It can be more complicated, but you can create really flexible markup.
 */
class DesktopContainer extends Component {
  state = {}

  hideFixedMenu = () => this.setState({ fixed: false })
  showFixedMenu = () => this.setState({ fixed: true })

  render() {
    const { children } = this.props
    const { fixed } = this.state

    return (
      <Responsive minWidth={Responsive.onlyTablet.minWidth}>
        <div className="relative">
        <div className="static-gradient blue absolute z-0" >
          <div className="static-gradient-bg absolute z-5"></div>
        </div>
          <Segment
            textAlign='center'
            style={{  padding: '1em 0em',
            borderBottom: '0px',
            boxShadow: 'none',
            height: '400px'
            }}
            vertical
          >

            <Menu
              fixed={fixed ? 'top' : null}
              inverted={true}
              pointing={false}
              secondary={true}
              size='huge'
              style={{  marginRight: '0px'}}
            >
              <Container>
                <Menu.Item ><Header as='h3' inverted>{site_name}</Header></Menu.Item>
                <Link to="/systems"><Menu.Item link >Listen</Menu.Item></Link>
                <Link to="/about"><Menu.Item link >About</Menu.Item></Link>
              </Container>
            </Menu>
            <HomepageHeading />
          </Segment>
          </div>

        {children}
      </Responsive>
    )
  }
}
/*
DesktopContainer.propTypes = {
  children: PropTypes.node,
}
*/
class MobileContainer extends Component {
  state = {}

  handlePusherClick = () => {
    const { sidebarOpened } = this.state

    if (sidebarOpened) this.setState({ sidebarOpened: false })
  }

  handleToggle = () => this.setState({ sidebarOpened: !this.state.sidebarOpened })

  render() {
    const { children } = this.props
    const { sidebarOpened } = this.state

    return (
      <Responsive maxWidth={Responsive.onlyMobile.maxWidth}>
        <Sidebar.Pushable>
          <Sidebar as={Menu} animation='uncover' inverted vertical visible={sidebarOpened} id="menu-bar">
            <Menu.Item  active>
              Home
            </Menu.Item>
            <Menu.Item ><Link to="/systems">Systems</Link></Menu.Item>
            <Menu.Item ><Link to="/about">About</Link></Menu.Item>
          </Sidebar>

          <Sidebar.Pusher
            dimmed={sidebarOpened}
            onClick={this.handlePusherClick}
            style={{ minHeight: '100vh' }}
          >
          <div className='relative'>
          <div className="static-gradient blue absolute z-0">
            <div className="static-gradient-bg absolute"></div>
          </div>
            <Segment
              textAlign='center'
              style={{ minHeight: 350, padding: '1em 0em',
              borderBottom: '0px',
              boxShadow: 'none',
              height: '300px'}}
              vertical
            >

            <Container>

            <Menu inverted secondary size='large'>
              <Menu.Item onClick={this.handleToggle}>
                <Icon name='sidebar' />
              </Menu.Item>
              <Menu.Item header>{site_name}</Menu.Item>
            </Menu>
          </Container>
              <HomepageHeading mobile />
            </Segment>
          </div>
            {children}
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </Responsive>
    )
  }
}
/*
MobileContainer.propTypes = {
  children: PropTypes.node,
}
*/
const ResponsiveContainer = ({ children }) => (
  <div>
    <DesktopContainer>{children}</DesktopContainer>
    <MobileContainer>{children}</MobileContainer>
  </div>
)


// ----------------------------------------------------
const requestMessageStyle = {
  color: "red"
};

function SystemList(props) {
  const systems = props.systems;
  const listItems = numbers.map((number) =>
    <li>{number}</li>
  );
  return (
    <ul>{listItems}</ul>
  );
}

// ----------------------------------------------------
class Main extends Component {
  constructor(props) {
    super(props);
    this.advanceSystem = this.advanceSystem.bind(this);
    var activeSystems = []
    if  (props.system) {
      activeSystems = props.system.items.filter(system =>{
      if (system.active) {return true}
      return false;
     });
    }
    this.state = {  duration: 500, visible: true, currentSystem: 0, activeSystems}
  }



    handleChange = (e, { name, value }) => this.setState({ [name]: value })

    handleVisibility = () => this.setState({ visible: !this.state.visible })

    advanceSystem() {

        var currentSystem = this.state.currentSystem + 1;
        if (currentSystem > this.state.activeSystems.length) {
          currentSystem = 0;
        }
        this.setState({ visible: !this.state.visible, currentSystem });

    }

componentWillUpdate(nextProps) {

 if  (nextProps.system.items && (nextProps.system.items !== this.props.system.items)) {
   const activeSystems = nextProps.system.items.filter(system =>{
   if (system.active) {return true}
   return false;
  });
   this.setState({activeSystems});
 }
}
  componentDidMount() {
  		this.props.fetchSystems();
      this.interval = setInterval(() => this.advanceSystem(), 3000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
render() {
  const system = this.state.activeSystems[this.state.currentSystem];
  var clientCount = "";
  var callAvg = "";
  if (system) {


  if (system.callAvg) {
    callAvg = Math.round( system.callAvg * 10) / 10 + " call/min avg"
  }
  if (system.clientCount == 1 ) {
    clientCount = "1 listener";
  } else if (system.clientCount > 1 ) {
    clientCount = system.clientCount + " listeners"
  }
}
  return (
  <ResponsiveContainer>
    <div style={{  top: '-120px', position: 'relative' }}>
    <Segment style={{ padding: ' 0em', height: '350px', backgroudColor: '#FFF'}} vertical>
    <Grid columns='equal' stackable textAlign='center'  style={{ height: '350px', marginRight: '0px' }}>
      <Grid.Row textAlign='center'>
        <Grid.Column  style={{ paddingBottom: '4em', paddingTop: '2em', maxWidth: 450  }}>
        { system && (<Transition visible={this.state.visible} animation='pulse' duration={500}>

        <SystemCard keepShort={true} system={system} key={system.shortName} onClick={(e) => this.props.changeUrl("/system/" + system.shortName)}/>

      </Transition>)}
        </Grid.Column>
        <Grid.Column style={{ paddingBottom: '0em', paddingTop: '6em', maxWidth: 450  }}>
        <Link to="/systems">
        <Button primary size='huge' id="listen" animated>
          <Button.Content visible><Icon name='headphones' />
          <Icon name='right arrow' /></Button.Content>
          <Button.Content hidden>Listen</Button.Content>
        </Button>
        </Link>
        </Grid.Column>
      </Grid.Row>
    </Grid>

    </Segment>
    <Segment style={{ padding: '0em' }} vertical>
      <Grid celled='internally' columns='equal' stackable>
        <Grid.Row textAlign='center'>
          <Grid.Column style={{ paddingBottom: '5em', paddingTop: '5em' }}>
            <Header  as='h3' style={{ fontSize: '2em' }}>
              <Icon color='orange' name='list' />All The Calls
            </Header>
            <p style={{ fontSize: '1.33em' }}>Every call, on every talkgroup is recorded</p>
          </Grid.Column>
          <Grid.Column style={{ paddingBottom: '5em', paddingTop: '5em' }}>
            <Header as='h3' style={{ fontSize: '2em' }}>
              <Icon color='orange' name='checked calendar' />
              Go back in time
            </Header>
            <p style={{ fontSize: '1.33em' }}>
              Missed a call? Not a problem, everything is archived!
            </p>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>
    <Segment style={{ padding: '8em 0em' }} vertical>
      <Container text>
        <Header as='h3' style={{ fontSize: '2em' }}>
          Don't just scan, hear it all!
        </Header>
        <p style={{ fontSize: '1.33em' }}>
        Most large cities use trunked radio systems to get the most use out of their assigned radio spectrum. With trunked systems, the transmission are constantly hopping to different frequencies. Using a cheap Software Defined Radio (SDR), it is possible capture all of the transmission on a system.
        Instead of scanning to a single frequency, SDR capturea wide swathes of spectrum, covering all of the frequencies a system could use.
        </p>
        <Divider
          as='h4'
          className='header'
          horizontal
          style={{ margin: '3em 0em', textTransform: 'uppercase' }}
        >
          Get Involved
        </Divider>
        <Header as='h3' style={{ fontSize: '2em' }}>
          Want to record your local radio system?
        </Header>
        <p style={{ fontSize: '1.33em' }}>
        Join us! Record a local radio system and share it with the world. If you have a spare computer, it is easy to get started. With a $25 SDR or two, you can capture an entire system.
        It does take a little bit of work to get things setup, but we are here to help and answer questions.
        </p>
        <a href="https://github.com/robotastic/trunk-recorder/blob/master/README.md">
        <Button size='large'>
          Learn More
        </Button>
        </a>
      </Container>
    </Segment>
      </div>
    <Segment inverted vertical style={{ padding: '5em 0em' }} id="footer">
      <Container>
        <Grid divided inverted stackable>
          <Grid.Row>
            <Grid.Column width={6}>

            </Grid.Column>
            <Grid.Column width={4}>
            <Header as='h4' inverted>
              The End <Icon name='rocket' />
            </Header>
            </Grid.Column>
            <Grid.Column width={6}>


            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </Segment>

  </ResponsiveContainer>);
}

}

export default Main;
