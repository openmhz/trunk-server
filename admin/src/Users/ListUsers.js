import { useState } from "react";
import {
  Container,
  Header,
  Table,
  Icon,
  Input,
  Dropdown,
  Label,
  Button,
  Message,
  Modal,
  Form,
  Menu,
  Loader
} from "semantic-ui-react";
import { useSelector } from "react-redux";
import {
  useGetUserAccountsQuery,
  useUpdateUserAccountMutation,
  useDeleteUserAccountMutation,
  useResendConfirmationMutation
} from "../features/api/apiSlice";

const FILTERS = [
  { key: "all", value: "all", text: "All accounts" },
  { key: "supporters", value: "supporters", text: "Supporters" },
  { key: "admins", value: "admins", text: "Admins" },
  { key: "disabled", value: "disabled", text: "Disabled" },
  { key: "unconfirmed", value: "unconfirmed", text: "Unconfirmed email" },
];

function formatLocation(user) {
  return [user.city, user.state, user.country].filter(Boolean).join(", ") || "—";
}

function formatWhen(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

// ----------------------------------------------------
const ListUsers = () => {
  // The search box and the query are separate: typing should not fire a request
  // per keystroke, so the query only moves on submit.
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState({ q: "", filter: "all", page: 1 });
  const [confirming, setConfirming] = useState(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState(null);

  const currentUserId = useSelector((state) => state.user.userId);

  const { data, isFetching, isError } = useGetUserAccountsQuery(query);
  const [updateUser] = useUpdateUserAccountMutation();
  const [deleteUser] = useDeleteUserAccountMutation();
  const [resendConfirmation] = useResendConfirmationMutation();

  const runSearch = () => setQuery((q) => ({ ...q, q: searchText, page: 1 }));

  const openConfirm = (action, user) => {
    setReason("");
    setNotice(null);
    setConfirming({ action, user });
  };

  const performAction = async () => {
    const { action, user } = confirming;
    let result;
    try {
      if (action === "disable") {
        result = await updateUser({ userId: user._id, disabled: true, disabledReason: reason }).unwrap();
      } else if (action === "enable") {
        result = await updateUser({ userId: user._id, disabled: false }).unwrap();
      } else if (action === "grant-admin") {
        result = await updateUser({ userId: user._id, admin: true }).unwrap();
      } else if (action === "revoke-admin") {
        result = await updateUser({ userId: user._id, admin: false }).unwrap();
      } else if (action === "grant-supporter") {
        result = await updateUser({ userId: user._id, plan: "supporter" }).unwrap();
      } else if (action === "remove-supporter") {
        result = await updateUser({ userId: user._id, plan: "free" }).unwrap();
      } else if (action === "resend") {
        result = await resendConfirmation(user._id).unwrap();
      } else if (action === "delete") {
        result = await deleteUser(user._id).unwrap();
      }
      setConfirming(null);
      setNotice({ positive: true, text: describeSuccess(action, user) });
    } catch (err) {
      // The server explains why it refused - "still owns 3 systems", "cannot
      // disable your own account". Showing that beats a generic failure.
      const message = (err && err.data && err.data.message) || "That did not work. Please try again.";
      setNotice({ positive: false, text: message });
      setConfirming(null);
    }
  };

  const users = data && data.users ? data.users : [];

  return (
    <Container>
      <Header as="h1">
        User Accounts
        {data && <Header.Subheader>{data.total} account{data.total === 1 ? "" : "s"}</Header.Subheader>}
      </Header>

      <Menu secondary stackable>
        <Menu.Item>
          <Input
            icon={<Icon name="search" link onClick={runSearch} />}
            placeholder="Callsign, email, name or city"
            value={searchText}
            onChange={(e, { value }) => setSearchText(value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
          />
        </Menu.Item>
        <Menu.Item>
          <Dropdown
            selection
            options={FILTERS}
            value={query.filter}
            onChange={(e, { value }) => setQuery((q) => ({ ...q, filter: value, page: 1 }))}
          />
        </Menu.Item>
        <Menu.Item position="right">
          {isFetching && <Loader active inline size="small" />}
        </Menu.Item>
      </Menu>

      {notice &&
        <Message
          positive={notice.positive}
          negative={!notice.positive}
          onDismiss={() => setNotice(null)}
          content={notice.text}
        />}

      {isError && <Message negative content="Could not load accounts. Your admin session may have expired - try signing in again." />}

      <Table celled selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Callsign</Table.HeaderCell>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Location</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Systems</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Last login</Table.HeaderCell>
            <Table.HeaderCell textAlign="right">Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.length === 0 && !isFetching &&
            <Table.Row>
              <Table.Cell colSpan="8" textAlign="center">No accounts match that search.</Table.Cell>
            </Table.Row>}
          {users.map((user) => {
            const isSelf = user._id === currentUserId;
            return (
              <Table.Row key={user._id} negative={user.disabled}>
                {/* Callsign is the account's identity on the site, so it leads. */}
                <Table.Cell><strong>{(user.callsign || "").toUpperCase() || "—"}</strong></Table.Cell>
                <Table.Cell>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</Table.Cell>
                <Table.Cell><a href={`mailto:${user.email}`}>{user.email}</a></Table.Cell>
                <Table.Cell>{formatLocation(user)}</Table.Cell>
                <Table.Cell textAlign="center">{user.systemCount}</Table.Cell>
                <Table.Cell>
                  {user.plan === "supporter" && <Label size="tiny" color="teal">Supporter</Label>}
                  {user.admin && <Label size="tiny" color="blue">Admin</Label>}
                  {user.disabled && <Label size="tiny" color="red">Disabled</Label>}
                  {!user.confirmEmail && <Label size="tiny" color="orange">Unconfirmed</Label>}
                  {user.plan !== "supporter" && !user.admin && !user.disabled && user.confirmEmail && <span>Active</span>}
                </Table.Cell>
                <Table.Cell>{formatWhen(user.lastLogin)}</Table.Cell>
                <Table.Cell textAlign="right">
                  {/* The whole menu used to be disabled on your own row. Only
                      the items that could lock you out of the portal need that
                      - granting yourself Supporter is how you test the feature,
                      so the plan items stay live. */}
                  <Dropdown
                    button
                    className="icon"
                    icon="ellipsis horizontal"
                    direction="left"
                  >
                    <Dropdown.Menu>
                      {user.plan === "supporter"
                        ? <Dropdown.Item icon="star outline" text="Remove supporter" onClick={() => openConfirm("remove-supporter", user)} />
                        : <Dropdown.Item icon="star" text="Grant supporter" onClick={() => openConfirm("grant-supporter", user)} />}
                      <Dropdown.Divider />
                      {user.disabled
                        ? <Dropdown.Item icon="check" text="Enable account" disabled={isSelf} onClick={() => openConfirm("enable", user)} />
                        : <Dropdown.Item icon="ban" text="Disable account" disabled={isSelf} onClick={() => openConfirm("disable", user)} />}
                      {user.admin
                        ? <Dropdown.Item icon="user" text="Remove admin access" disabled={isSelf} onClick={() => openConfirm("revoke-admin", user)} />
                        : <Dropdown.Item icon="user plus" text="Grant admin access" disabled={isSelf} onClick={() => openConfirm("grant-admin", user)} />}
                      {!user.confirmEmail &&
                        <Dropdown.Item icon="mail" text="Resend confirmation email" onClick={() => openConfirm("resend", user)} />}
                      <Dropdown.Divider />
                      <Dropdown.Item icon="trash" text="Delete account" disabled={isSelf} onClick={() => openConfirm("delete", user)} />
                    </Dropdown.Menu>
                  </Dropdown>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>

      {data && data.pages > 1 &&
        <Menu pagination>
          <Menu.Item
            as="a"
            icon
            disabled={query.page <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
          ><Icon name="chevron left" /></Menu.Item>
          <Menu.Item>Page {data.page} of {data.pages}</Menu.Item>
          <Menu.Item
            as="a"
            icon
            disabled={query.page >= data.pages}
            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
          ><Icon name="chevron right" /></Menu.Item>
        </Menu>}

      <ConfirmModal
        confirming={confirming}
        reason={reason}
        setReason={setReason}
        onCancel={() => setConfirming(null)}
        onConfirm={performAction}
      />
    </Container>
  );
};

// ----------------------------------------------------

function describeSuccess(action, user) {
  const who = (user.callsign || user.email || "").toUpperCase();
  switch (action) {
    case "disable": return `${who} can no longer sign in.`;
    case "enable": return `${who} can sign in again.`;
    case "grant-admin": return `${who} now has admin access.`;
    case "revoke-admin": return `${who} no longer has admin access.`;
    case "grant-supporter": return `${who} is now a Supporter.`;
    case "remove-supporter": return `${who} is no longer a Supporter.`;
    case "resend": return `Confirmation email sent to ${user.email}.`;
    case "delete": return `Deleted the account for ${who}.`;
    default: return "Done.";
  }
}

const COPY = {
  disable: {
    header: "Disable this account?",
    body: "They will be signed out everywhere and will not be able to sign in or listen. Their systems keep uploading and nothing is deleted, so this can be undone at any time.",
    button: "Disable account",
    color: "orange",
  },
  enable: {
    header: "Enable this account?",
    body: "They will be able to sign in and listen again.",
    button: "Enable account",
    color: "green",
  },
  "grant-admin": {
    header: "Grant admin access?",
    body: "They will be able to see and administer every account and every system on the site, including yours.",
    button: "Grant admin access",
    color: "blue",
  },
  "revoke-admin": {
    header: "Remove admin access?",
    body: "They keep their account and their own systems, but lose access to the admin portal.",
    button: "Remove admin access",
    color: "orange",
  },
  "grant-supporter": {
    header: "Make this account a Supporter?",
    body: "Supporters get the enhanced features, starting with call transcripts. Use this for people who have paid or donated - there is no billing wired up yet, so this is the only way to grant it.",
    button: "Grant supporter",
    color: "teal",
  },
  "remove-supporter": {
    header: "Remove Supporter status?",
    body: "They keep their account and can still listen, but lose the enhanced features. Nothing is deleted and this can be undone at any time.",
    button: "Remove supporter",
    color: "orange",
  },
  resend: {
    header: "Resend the confirmation email?",
    body: "A fresh confirmation link will be emailed to this address. Any link sent earlier stops working.",
    button: "Send email",
    color: "blue",
  },
  delete: {
    header: "Delete this account?",
    body: "This cannot be undone. Accounts that still own systems cannot be deleted - disable those instead. Their login history is kept.",
    button: "Delete account",
    color: "red",
  },
};

const ConfirmModal = ({ confirming, reason, setReason, onCancel, onConfirm }) => {
  if (!confirming) return null;
  const copy = COPY[confirming.action];
  const who = (confirming.user.callsign || "").toUpperCase() || confirming.user.email;

  return (
    <Modal open size="tiny" onClose={onCancel}>
      <Modal.Header>{copy.header}</Modal.Header>
      <Modal.Content>
        <p><strong>{who}</strong> — {confirming.user.email}</p>
        <p>{copy.body}</p>
        {confirming.action === "disable" &&
          <Form>
            <Form.Input
              label="Reason (optional, for your own records)"
              placeholder="e.g. repeated abuse reports"
              value={reason}
              maxLength={200}
              onChange={(e, { value }) => setReason(value)}
            />
          </Form>}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color={copy.color} onClick={onConfirm}>{copy.button}</Button>
      </Modal.Actions>
    </Modal>
  );
};

export default ListUsers;
