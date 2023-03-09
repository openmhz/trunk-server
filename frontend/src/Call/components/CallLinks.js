import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

export function useCallLink(currentCall) {
    const filterType = useSelector((state) => state.callPlayer.filterType);
    const filterGroupId = useSelector((state) => state.callPlayer.filterGroupId);
    const filterTalkgroups = useSelector((state) => state.callPlayer.filterTalkgroups);
    const shortName = useSelector((state) => state.callPlayer.shortName);
    if (currentCall) {
        let search = ""
        const time = new Date(currentCall.time);
        const callTime = time.toLocaleTimeString();
        const callDate = time.toLocaleDateString();

        switch (filterType) {

            case 1:
                search = `filter-type=group&filter-code=${filterGroupId}&`;
                break;
            case 2:
                search = `filter-type=talkgroup&filter-code=${filterTalkgroups}&`;
                break;
            default:
            case 0:
                break;

        }
        const callLink = "/system/" + shortName + "?" + search + "call-id=" + currentCall._id + "&time=" + (time.getTime() + 1);
        const callDownload = currentCall.url;
        const callTweet = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(document.location.origin + callLink) + "&via=" + encodeURIComponent("OpenMHz");

        return { callLink, callDownload, callTweet }
    } else {
        return { callLink: "", callDownload: "", callTweet: "" }
    }
}