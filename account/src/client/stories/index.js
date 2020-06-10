import React from 'react';
import { storiesOf } from '@storybook/react';
import { Button } from '@storybook/react/demo';
import InvoiceList from '../Billing/InvoiceList';
import 'semantic-ui-css/semantic.min.css'

storiesOf('Button', module)
  .add('with text', () => (
    <Button>Hello Button</Button>
  ))
  .add('with some emoji', () => (
    <Button><span role="img" aria-label="so cool">😀 😎 👍 💯</span></Button>
  ));   


  export const invoices = [{"amount_due":1500,"amount_paid":1500,"date":1548819212,"invoice_pdf":"https://pay.stripe.com/invoice/invst_BYlZ3MlhYMHEStbvdVJ6vddxgp/pdf","paid":true,"status":"paid","description":null},{"amount_due":1500,"amount_paid":1500,"date":1548819083,"invoice_pdf":"https://pay.stripe.com/invoice/invst_ts0VnXKuxHWHce02yjhu0Cz455/pdf","paid":true,"status":"paid","description":null},{"amount_due":1500,"amount_paid":1500,"date":1548818978,"invoice_pdf":"https://pay.stripe.com/invoice/invst_HSjke6BJAWGlZL8ggn3Jgb8pnT/pdf","paid":true,"status":"paid","description":null},{"amount_due":6500,"amount_paid":6500,"date":1548816924,"invoice_pdf":"https://pay.stripe.com/invoice/invst_joLNjLFGU3PIondKAAop6kJaSZ/pdf","paid":true,"status":"paid","description":null},{"amount_due":1500,"amount_paid":1500,"date":1548772157,"invoice_pdf":"https://pay.stripe.com/invoice/invst_cSWcbq3UKUHxPQChSjkxRKx6gO/pdf","paid":true,"status":"paid","description":null},{"amount_due":1500,"amount_paid":1500,"date":1548772077,"invoice_pdf":"https://pay.stripe.com/invoice/invst_1aMYlwnPOdXKbebGuCjQfUrsg2/pdf","paid":true,"status":"paid","description":null}];

storiesOf('InvoiceList', module).add("standard", () => { 
  return (<InvoiceList invoices={invoices}/>)
     
});