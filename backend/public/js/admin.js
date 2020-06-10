var Admin = function () {
    
};


Admin.prototype.approvePendingSource = function(objectId, successCallBack) {
     var data = {
         objectId: objectId
    };
    $.ajax({
        url: "https://api.openmhz.com/approve_pending_source",
        type: "POST",
        dataType: "json",
        cache: false,
        data: data,
        timeout: 5000,
        success: function (data) {
            successCallBack(data);
        }
    });
}
Admin.prototype.removePendingSource = function (objectId, successCallBack) {
    var data = {
        objectId: objectId
    };
    $.ajax({
        url: "https://api.openmhz.com/remove_pending_source",
        type: "POST",
        dataType: "json",
        cache: false,
        data: data,
        timeout: 5000,
        complete: function () {
            //called when complete
            //console.log('process complete');

        },

        success: function (data) {
            sources = data.sources;
            successCallBack(data);
        },

        error: function () {
            //console.log('process error');
        },
    });

};

Admin.prototype.updatePendingSource = function (sourceId, objectId, shortName, name, successCallBack) {
    var data = {
        sourceId: sourceId,
        objectId: objectId,
        shortName: shortName,
        name: name
    };
    $.ajax({
        url: "https://api.openmhz.com/pending_sources",
        type: "POST",
        dataType: "json",
        cache: false,
        data: data,
        timeout: 5000,
        complete: function () {
            //called when complete
            //console.log('process complete');

        },

        success: function (data) {
            sources = data.sources;
            successCallBack(data);
        },

        error: function () {
            //console.log('process error');
        },
    });

};

Admin.prototype.fetchPendingSources = function(successCallBack) {
    $.ajax({
        url: "https://api.openmhz.com/pending_sources",
        type: "GET",
        contentType: "application/json",
        success: function (data) {
            successCallBack(data);
        }
    });
}

Admin.prototype.fetchPendingSource = function(objectId, successCallBack) {
     var data = {
         objectId: objectId
    };
    $.ajax({
        url: "https://api.openmhz.com/fetch_pending_sources",
        type: "POST",
        dataType: "json",
        cache: false,
        data: data,
        timeout: 5000,
        success: function (data) {
            successCallBack(data);
        }
    });
}


/*****  Sources   *****/

Admin.prototype.removeSource = function (objectId,successCallBack) {
    var data = {
        objectId: objectId
    };
    $.ajax({
        url: "https://api.openmhz.com/remove_source",
        type: "POST",
        dataType: "json",
        cache: false,
        data: data,
        timeout: 5000,
        complete: function () {
            //called when complete
            //console.log('process complete');

        },

        success: function (data) {
            sources = data.sources;
            successCallBack(data);
        },

        error: function () {
            //console.log('process error');
        },
    });

};

Admin.prototype.updateSource = function (sourceId, objectId, shortName, name, successCallBack) {
    var data = {
        sourceId: sourceId,
        objectId: objectId,
        shortName: shortName,
        name: name
    };
    $.ajax({
        url: "https://api.openmhz.com/sources",
        type: "POST",
        dataType: "json",
        cache: false,
        data: data,
        timeout: 5000,
        complete: function () {
            //called when complete
            //console.log('process complete');

        },

        success: function (data) {
            sources = data.sources;
            successCallBack(data);
        },

        error: function () {
            //console.log('process error');
        },
    });

};

Admin.prototype.fetchSources = function(successCallBack) {
    $.ajax({
        url: "https://api.openmhz.com/sources",
        type: "GET",
        contentType: "application/json",
        success: function (data) {
            successCallBack(data);
        }
    });
}