import React, { Component } from "react";

import {
  Container,
  Table
} from "semantic-ui-react";

class InvoiceList extends Component {
 

 
 
    constructor(props) {
      super(props);
    }

    render() {
      const DATE_OPTIONS = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return (
          <Table singleLine>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Date</Table.HeaderCell>
        <Table.HeaderCell>Amount</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell></Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
    {this.props.invoices.map((invoice, index) => {
     return( <Table.Row>
      <Table.Cell>{(new Date(invoice.date*1000)).toLocaleDateString('en-US', DATE_OPTIONS)}</Table.Cell>
      <Table.Cell>${invoice.amount_due/100}</Table.Cell>
      <Table.Cell>{invoice.status} </Table.Cell>
      <Table.Cell><a href={invoice.invoice_pdf}>View Invoice</a> </Table.Cell>
      </Table.Row>)
    } )}
    </Table.Body>
    </Table>
        )
    }
}
export default InvoiceList;
