import React, { Component } from "react";
import { Elements, StripeProvider} from 'react-stripe-elements';
import { Container, Header, Segment, Icon, Divider, Button, Message } from 'semantic-ui-react'
import PaymentSource from "./PaymentSource"
import InvoiceList from "./InvoiceList"
// ----------------------------------------------------
class Billing extends Component {
    constructor(props) {
      super(props);
      this.handleShowAddSource = this.handleShowAddSource.bind(this);
      this.handleNewSource = this.handleNewSource.bind(this);
      this.state = {showAddSource: false};
    }

  
    componentDidMount() {
        this.props.fetchBilling();
        this.props.fetchInvoices();
        }
  handleShowAddSource() {
      this.setState({
        showAddSource: !this.state.showAddSource
      });
    }
    handleNewSource(newSource) {
      this.setState({
        showAddSource: false
      });
      this.props.updateCard(newSource);
    }
  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
    render() {
      var name = this.props.user.firstName + " " + this.props.user.lastName;
      var section=<div/>;
      if (!this.props.billing || this.state.showAddSource) {
       section =  (<div>
        <StripeProvider apiKey="">
        <Elements>
          <PaymentSource name={name} email={this.props.user.email} onCancel={this.handleShowAddSource} onSubmit={this.handleNewSource}/>
        </Elements>
          </StripeProvider>
        </div>)
      } else {
       section =  (<Segment padded='very'>
        <Divider horizontal>
          <Header as='h3'>
            <Icon name='credit card outline' />
            Card on File
          </Header>
        </Divider>
        <Header as='h3'>
        <Header.Content>
        {this.props.billing.source.name}  xxxx-{this.props.billing.source.last4}
      <Header.Subheader>Expires {this.props.billing.source.exp_month} / {this.props.billing.source.exp_year}</Header.Subheader>
    </Header.Content>    
       </Header>
          <Button  onClick={this.handleShowAddSource}>Change Card</Button>
        </Segment>)
      }

      return (
        <Container text>
        <Header as='h2'>
        Payment Method</Header>
        <p>It is free to use OpenMHz. Add payment in order to upgrade features.</p>
        {section}
        <Header as='h2'>
        Payment History</Header>
        {this.props.billing.invoices.length > 0 ? (
          <InvoiceList invoices={this.props.billing.invoices}/>
        ) : (
          <Message>
          <Message.Header>Changes in Service</Message.Header>
          <p>
            We updated our privacy policy here to better service our customers. We recommend reviewing the
            changes.
          </p>
        </Message>
        )}
        </Container>
    );
  }
}

export default Billing;