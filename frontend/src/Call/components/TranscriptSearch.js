import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input, Icon, Message, Menu } from "semantic-ui-react";

import { setQueryFilter } from "../../features/callPlayer/callPlayerSlice";
import { getCalls } from "../../features/calls/callsSlice";
import { selectIsSupporter } from "../../features/user/userSlice";

/**
 * Search over what was said, rather than over when it was said.
 *
 * The server does the searching with a mongo text index, and only for
 * Supporters - searching text you are not allowed to read would leak it a word
 * at a time. So a free account gets the box, an explanation and nothing else;
 * the query is never sent.
 *
 * Deliberately a filter on the ordinary call list rather than a separate
 * results view: playback, the waveform, starring and paging all keep working
 * because the results *are* the call list.
 */

export const TranscriptSearchBox = () => {
  const dispatch = useDispatch();
  const isSupporter = useSelector(selectIsSupporter);
  const filterQuery = useSelector((state) => state.callPlayer.filterQuery);

  // The box and the applied search are separate: typing should not fire a
  // query per keystroke, so nothing happens until Enter.
  const [text, setText] = useState(filterQuery || "");

  // Keeps the box honest when the search is cleared from the results strip, or
  // arrives from the URL on load.
  useEffect(() => { setText(filterQuery || ""); }, [filterQuery]);

  const submit = () => {
    const next = text.trim();
    if (next === (filterQuery || "")) return;
    dispatch(setQueryFilter(next));
    dispatch(getCalls({}));
  };

  return (
    <Menu.Item className="transcript-search-item">
      <Input
        size="small"
        icon={
          text
            ? <Icon name="close" link onClick={() => { setText(""); dispatch(setQueryFilter("")); dispatch(getCalls({})); }} />
            : <Icon name="search" />
        }
        placeholder={isSupporter ? "Search transcripts" : "Search transcripts (Supporters)"}
        value={text}
        onChange={(e, { value }) => setText(value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        disabled={!isSupporter}
        title={isSupporter ? "Search what was said, across the archive" : "Transcript search is a Supporter feature"}
      />
    </Menu.Item>
  );
};

/**
 * The strip above the call list saying what is being shown, and how to get back
 * to everything. Without it a filtered list is indistinguishable from a quiet
 * repeater.
 */
export const TranscriptSearchBanner = ({ resultCount }) => {
  const dispatch = useDispatch();
  const isSupporter = useSelector(selectIsSupporter);
  const filterQuery = useSelector((state) => state.callPlayer.filterQuery);

  if (!filterQuery) return null;

  const clear = () => {
    dispatch(setQueryFilter(""));
    dispatch(getCalls({}));
  };

  // A shared search URL opened by a free account: the server ignored the query
  // and returned the ordinary list, so say that rather than let them think
  // these are results.
  if (!isSupporter) {
    return (
      <Message warning onDismiss={clear} icon>
        <Icon name="lock" />
        <Message.Content>
          <Message.Header>Transcript search is a Supporter feature</Message.Header>
          Showing all calls instead.{" "}
          <a href={`${process.env.REACT_APP_ACCOUNT_SERVER}/profile`}>Become a Supporter</a> to search
          what was said.
        </Message.Content>
      </Message>
    );
  }

  return (
    <Message info onDismiss={clear} icon>
      <Icon name="search" />
      <Message.Content>
        <Message.Header>
          {resultCount === 0
            ? <>Nothing said matches “{filterQuery}”</>
            : <>Calls mentioning “{filterQuery}”</>}
        </Message.Header>
        {resultCount === 0
          ? "Transcripts only cover the last 30 days, and only what was clear enough to transcribe."
          : "Live calls are paused while searching — a call has to be transcribed before it can match."}
      </Message.Content>
    </Message>
  );
};
