import React, { Component }  from "react"
import {
  Container,
  Header,
  Button,
  Message,
  Icon
} from "semantic-ui-react";
class WaitConfirmEmail extends Component {
  constructor(props) {
      super(props);
    this.handleSendConfirmEmail = this.handleSendConfirmEmail.bind(this);

  }
  handleSendConfirmEmail(event) {
    this.props.sendConfirmEmail(this.props.user.userId).then(loginMessage => {
      if (loginMessage) {
        // report to the user is there was a problem during login
        this.setState({
          loginMessage
        });
      }
    });
  };
  
	render() {
		return(
			<Container text>
        <Message icon>
   <Icon name='envelope outline'/>
   <Message.Content>
     <Message.Header>Confirm your email address</Message.Header>
       <p>We sent an email to the address you gave us: {this.props.user.email}<br/>
       Please click on the link in the email to verify the email address.</p>
     <Header as='h3'>Didn't get an email?</Header>
         <p>So, you have waited a bit and haven't gotten anything?</p>
          <p>...and you checked your spam folder?</p>
          <p>Well, click below.</p>
         <Button
             size="large"
             content="Resend Email Confirmation"
             onClick={this.handleSendConfirmEmail}
           />
   </Message.Content>
 </Message>

</Container>
		)
	}
}

export default WaitConfirmEmail
