var Scanner = function() {
    this._socket = null;
    this.FilterType = {
        All: 0,
        Talkgroup: 1,
        Group: 2,
        Unit: 3
    };
    this.talkgroups = {};
    this.url = "";
    this.sources = {};
    this.filterCode = "";
    this.filterDate = 0;
    this.filterName = "All";
    this.filterType = this.FilterType.All;

    this.groups = [{
            name: 'Fire',
            code: 'group-fire'
        },

        {
            name: 'Medical',
            code: 'group-medical'
        },
        {
            name: 'Services',
            code: 'group-services'
        },
        {
            name: 'Emergency',
            code: 'group-emergency'
        },
        {
            name: 'Police',
            code: 'group-police'
        },
        {
            name: 'Security',
            code: 'group-security'
        },
        {
            name: 'Transportation',
            code: 'group-transportation'
        }
    ];
};



if (typeof console === "undefined") {
    console = {
        log: function() {},
        debug: function() {}
    };
}

Scanner.prototype.socketUpdate = function(messageCallback) {
    if (this._socket) {
        var typeString = 'all';
        switch (this.filterType) {
            case this.FilterType.Group:
                var typeString = 'group';
                break;
            case this.FilterType.Talkgroup:
                var typeString = 'talkgroup';
                break;
            case this.FilterType.Unit:
                var typeString = 'unit';
                break;
        }
        var shortName = startUp.shortName.toLowerCase();

        this._socket.send(JSON.stringify({
            type: 'update',
            filterCode: this.filterCode,
            filterType: typeString,
            filterName: this.filterName,
            shortName: shortName
        }));
    }
}



Scanner.prototype.socketConnect = function(messageCallback) {
    console.log("WebSocket trying to connect");

    var typeString = 'all';
    switch (this.filterType) {
        case this.FilterType.Group:
            var typeString = 'group';
            break;
        case this.FilterType.Talkgroup:
            var typeString = 'talkgroup';
            break;
        case this.FilterType.Unit:
            var typeString = 'unit';
            break;
    }
    var shortName = startUp.shortName.toLowerCase();
    if (!this._socket) {

        this._socket = new WebSocket(startUp.socket_server); // + startUp.backend_server); // 'wss://openmhz.com/');
        if (typeof messageCallback === "function") {

            this._socket.onmessage = messageCallback.bind(this);
        }

        this._socket.onopen = function(e) {
            console.log('Socket Connected - sending add: ' + e);
            this._socket.send(JSON.stringify({
                type: 'add',
                filterCode: this.filterCode,
                filterType: typeString,
                filterName: this.filterName,
                shortName: shortName
            }));
        }.bind(this);
    } else {
        console.log('Socket Already Connected - sending update');
        this._socket.send(JSON.stringify({
            type: 'update',
            filterCode: this.filterCode,
            filterType: typeString,
            filterName: this.filterName,
            shortName: shortName
        }));
    }
};

Scanner.prototype.socketDisconnect = function() {
    console.log('Disconnecting WebSocket');
    if (this._socket) {
        this._socket.close();
    }
};


Scanner.prototype.updateFilter = function(name, type, code) {
    this.filterCode = code;
    this.filterName = name;
    this.filterType = type;

};

Scanner.prototype.updateArchive = function(archiveDateTime) {
    if (archiveDateTime != null) {
        this.filterDate = archiveDateTime.getTime();
    } else {
        this.filterDate = 0;
    }
};

Scanner.prototype.getUrl = function() {
    return this.url;
};

Scanner.prototype.buildTags = function(talkgroups) {
    var tags = {}
    for (var tg in talkgroups) {
        var tag = talkgroups[tg].tag;
        if (!tags.hasOwnProperty(tag)) {
            tags[tag] = {};
            tags[tag].talkgroupNums = []
        }
        tags[tag].talkgroupNums.push(talkgroups[tg].num);
    }
    console.log(tags);
    return tags;
};

Scanner.prototype.buildGroups = function(talkgroups) {
    var groups = {}
    for (var tg in talkgroups) {
        var group = talkgroups[tg].group;
        if (!groups.hasOwnProperty(group)) {
            groups[group] = {};
            groups[group].talkgroupNums = []
        }
        groups[group].talkgroupNums.push(talkgroups[tg].num);
    }
    console.log(groups);
    return groups;
};

Scanner.prototype.fetchTalkgroups = function(successCallback) {
    console.log(startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/talkgroups");
    var scanner = this;
    $.ajax({
        url: startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/talkgroups",
        type: "GET",
        contentType: "application/json",
        success: function(data) {
            this.talkgroups = data.talkgroups;
            this.sources = data.sources;
            data.groups = scanner.buildGroups(data.talkgroups);
            data.tags = scanner.buildTags(data.talkgroups);
            successCallback(data);
        }
    });
};


Scanner.prototype.fetchCallInfo = function(id, successCallback) {

    $.ajax({
        url: startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/call/" + id,
        type: "GET",
        contentType: "application/json",
        success: successCallback
    });
};

Scanner.prototype.fetchSingleCall = function(success, error, callId) {

    if ((typeof error !== 'function') && (typeof error !== 'undefined')) {
        callId = error;
        error = this.fetchCallsError;
    }
    //contentType: "application/json",
    $.ajax({
        url: startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/call/" + callId,
        type: "GET",
        dataType: "json",
        cache: true,
        timeout: 5000,
        complete: function() {
            //called when complete
            console.log('process complete');
        },

        success: function(data) {
            success(data);
        },

        error: function(request, status, error) {
            console.log(request.responseText);
        },
    });
};

Scanner.prototype.fetchCalls = function(success, error, date, direction) {
    var params = {};
    var url = "";

    if ((typeof error !== 'function') && (typeof error !== 'undefined')) {
        direction = date;
        date = error;
        error = this.fetchCallsError;
    }


    if ((typeof direction === 'string') && (typeof date === 'number')) {
        url = url + '/' + direction;
        params["time"] = date;
    }

    if (this.filterCode != "") {
        params["filter-code"] = this.filterCode;
    }

    if (this.filterType == this.FilterType.Group) {
        params["filter-type"] = "group";
        params["filter-name"] = this.filterName;
    }

    if (this.filterType == this.FilterType.Talkgroup) {
        params["filter-type"] = "talkgroup";
    }

    if (this.filterType == this.FilterType.Unit) {
        params["filter-type"] = "unit";
    }


    url = url + '?' + $.param(params);
    this.url = url;
    console.log("Trying to fetch data from this url: " + url);
    //contentType: "application/json",
    $.ajax({
        url: startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/calls" + url,
        type: "GET",
        dataType: "json",
        cache: true,
        timeout: 5000,
        complete: function() {
            //called when complete
            console.log('process complete');
        },

        success: function(data) {
            success(data);
        },

        error: function(request, status, error) {
            console.log(request.responseText);
        },
    });
};

Scanner.prototype.fetchStats = function(successCallback) {
    $.ajax({
        url: startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/stats",
        type: "GET",
        contentType: "application/json",
        success: successCallback
    });
};

Scanner.prototype.setSource = function(sourceId, tagName, name, callId) {
    var data = {
        sourceId: sourceId,
        tagName: tagName,
        shortName: startUp.shortName.toLowerCase(),
        name: name,
        callId: callId
    };
    $.ajax({
        url: startUp.backend_server + "/" + startUp.shortName.toLowerCase() + "/pending_sources",
        type: "POST",
        dataType: "json",
        cache: true,
        data: data,
        timeout: 5000,
        complete: function() {
            //called when complete
            //console.log('process complete');

        },

        success: function(data) {
            sources = data.sources;
        },

        error: function() {
            //console.log('process error');
        },
    });

};

Scanner.prototype.fetchCallsError = function() {
    console.log("Errr fetching calls");
}
