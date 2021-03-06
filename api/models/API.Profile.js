
'use strict';
var mongo = require("./../db.connection.js");
var drive = require("./../googleDriveHelper.js")();
var shortId = require("shortid");
var APIException = require("./API.Exception.js");
var apiException = new APIException();
var async = require('async');
var _ = require("underscore-node");
var Group = require("./API.Group.js");
var AssetManager = require("./../models/API.AssetManager.js");

var API = API || {}; // Namespace
API.Profile = function (profileData) {

    if (profileData) {
        this._id = profileData._id;
        this.userName = profileData.userName;
        this.firstName = profileData.firstName;
        this.lastName = profileData.lastName;
        this.picture = profileData.picture;
        this.emailId = profileData.emailId;
        this.address = profileData.address;
        this.city = profileData.city;
        this.country = profileData.country;
        this.zipCode = profileData.zipCode;
    }
};
/**
 * update user profile 
 * @param {object} user - user object to update
 * @return {object} userProfile - profile of the user
 * @return {string} userProfile.userName - user name
 * @return {string} userProfile.firstName - first name of the user
 * @return {string} userProfile.lastName - Last Name of the user
 * @return {string} userProfile.picture - picture of the user
 * @return {string} userProfile - EmailId of the user
 * @return {string} userProfile - Address of the user
 * @return {string} userProfile - City of the user
 * @return {string} userProfile - ZipCode of the user
 * @return {string} userProfile - ZipCode of the user
 */
API.Profile.prototype.update = function (u, cb) {
    //Find if this user already exist
    var filter = { "userName": user.userName };
    mongo.client.connect(mongo.uri, function (conErr, db) {
        var filter = { "userName": user.UserName };
        db.collection("profiles").find(filter).toArray(function (e, data) {
            if (e) {
                db.close();
                return cb(new apiException.invalidInput(e.message, "Account"));
            }
            var p = {
            };
            if (u.firstName) { p.firstName = u.firstName; }
            if (u.lastName) { p.lastName = u.lastName }
            if (u.alternateEmail) { p.alternateEmail = u.alternateEmail; }
            if (u.emailId) { p.emailId = u.emailId; }
            if (u.picture) { p.picture = u.picture; }
            if (u.address) { p.address = u.address; }
            if (u.city) { p.city = u.city; }
            if (u.country) { p.country = u.country }
            if (u.zipCode) { p.zipCode = u.zipCode }

            db.collection("profiles").insert(p, { "forceServerObjectId": false, "upsert": true, "fullResult": true }, function (e, data) {
                if (e) {
                    db.close();
                    return cb(new apiException.serverError(null, "Core", e));
                }
                return cb(null, p);
            });
        });
    });//mongo connect
};
/**
 * get the user's groups 
 * @param {array[object]} groups - array of group object
 * @return {object} group.name - name
 * @return {string} group.__id - group id
 * @return {string} group.desciption - description 
 * @return {string} group.lastName - locale
 * @return {string} group.picture - status
 * @return {string} group.thumbnail - thumbnail
 * @return {array[object]} group.memberes - members
 * @return {string} group.groupType - groupType
 * @return {string} group.createdBy - createdBy
 * @return {string} group.updatedBy - updatedBy
 * @return {string} group.updatedOn - updatedOn
 */
API.Profile.prototype.getGroups = function (options, cb) {
    if (options == null) {
        options = {};
    }
    var search = {};
    if (this._id == null) {
        return cb(new apiException.unauthenticated('unauthorized', 'Profile'));
    }

    if (options._id && options._id != 0) {
        search._id = options._id;
    }
    if (options.name && options.name.length > 0) {
        search.Name = options.name;
    }
    var profileId = this._id;
    //TODO
    //search.Members = {$in : [new mongoose.Types.ObjectId(u._id)]};
    search.members = {$in : [profileId]};

    mongo.connect()
    .then(function (db) {
        db.collection("groups")
        .find(search)
        .toArray(function (e, resultGroups) {
            if (e) {
                db.close();
                return cb(new APIException(null, 'Profile', e));
            }
            var result = [];
            async.eachSeries(resultGroups, function (grp, callback) {
                //{"_id":  {$in: ["VJvggm7ug","VJ0esDQ_e","41yeBrY_l","NJ6PJdKFe","EyfRUZB5x"]} }
                var g = new Group(grp);
                var members = g.members;
                db.collection("profiles")
                .find({ "_id": { $in: members } }).toArray(function (e, members) {
                    if (e) {
                        return callback();
                    }
                    else {
                        g.members = members;
                        result.push(g);
                        return callback();
                    }
                });
            }, function () {
                db.close();
                return cb(null, result);
            });
        });
    });
};
/**
 * Add member to group
 * @param {array[object]} groupData - array of group object
 * @param {string} group.__id - group id
 * @param {array[object]} group.memberes - members
 * @return {object} group
 */
API.Profile.prototype.createOrUpdateGroup = function (groupData, cb) {
    console.log("controller : post artifact");
    var self = this;
    var param = groupData;
    var data = {}
    data._id = param._id;
    if(data._id == null){
        data._id = shortId.generate();
        data.createdBy = self._id;
    }
    
    data.members = [];
    if (param.members) {
        data.members = _.pluck(param.members, "_id");
    }

    if(!_.contains(data.members, self._id)){
        data.members.push(self._id);
    }


    if (param.name) {
        data.name = param.name;
    }


    if (param.description)
        data.description = param.description;
    if (param.locale)
        data.locale = param.locale;
    if (param.status)
        data.status = param.status;
    if (param.thumbnail)
        data.thumbnail = param.thumbnail;
    if (param.url)
        data.url = param.url;
    if (param.groupType)
        data.groupType = param.groupType;
    
    
    data.updatedBy = this._id;
    data.updatedOn = new Date();
    if (param.clientId)
        data.clientId = param.clientId;

    mongo.connect()
    .then(function (db) {
        db.collection("groups")
        .findOneAndUpdate({ "_id": data._id }, { $set: data }, { "upsert": true, "forceServerObjectId": false, "returnOriginal": false }, function (err, data) {
            if (err) {
                return cb(new APIException(null, 'Profile', err))
            }
            //check if the data.thumbnail is base64 image or an url
            //if base64 then save it as file in drive and update url to this group

            //create storage for group if doesn't exist
            updateGroupStorage(data.value, function (e, gdata) {
                //create group and send it.
                self.getGroups({'_id': gdata._id}, function(e, result){
                    if(e){
                        return cb(new APIException('Group saved but there is a problem retrieving it.', 'Profile', err));
                    }
                    return cb(null, result[0]);
                });
            })
        });
    });
};

API.Profile.prototype.addMember = function (groupData, cb) {
    console.log("controller : add member");
    var self = this;
    var param = groupData;
    var data = {}

    if (param._id == null) {
        var ex = new apiException.unauthenticated('unauthorized', 'Group');
        return cb(ex, null);
    }
    
    data.members = [];
    if (param.members) {
        data.members = _.pluck(param.members, "_id");
    }
    
    if(!_.contains(data.members, self._id)){
        data.members.push(self._id);
    }
    
    data.updatedBy = this._id;
    data.updatedOn = new Date();
    
    mongo.connect()
    .then(function (db) {
        db.collection("groups")
        .findOneAndUpdate({ "_id": data._id }, { $set: data }, { "upsert": true, "forceServerObjectId": false, "returnOriginal": false }, function (err, data) {
            if (err) {
                return cb(new APIException(null, 'Profile', err));
            }
            //check if the data.thumbnail is base64 image or an url
            //if base64 then save it as file in drive and update url to this group
            self.getGroups({'_id': gdata._id}, function(e, result){
                if(e){
                    return cb(new APIException('Member saved but there is a problem retrieving it.', 'Profile', err));
                }
                return cb(null, result[0]);
            });
        });
    });
};

/**
 * Create or update drive storage for group
 */
function updateGroupStorage(gdata, cb) {
    if (gdata._fileStorage == null) {
        drive.createFolder(gdata._id, gdata.name, null, function (err, resp) {
            if (err) {
                console.error(err);
                return cb(null, gdata);
            }
            console.log(resp);
            gdata._fileStorage = resp.id;
            drive.makePublic(gdata._fileStorage, function (err, result) {
                if (err) {
                    console.error(err);
                    return cb(null, gdata);
                }
                mongo.connect()
                    .then(function (db) {
                        db.collection("groups")
                            .findOneAndUpdate({ "_id": gdata._id }, { $set: { "_fileStorage": gdata._fileStorage } }, null, function (err, data) {
                                if (err) {
                                    return cb(err);
                                }
                                return cb(null, data.value);
                            });
                    });
            });
        });
    }
    else {
        drive.makePublic(gdata._fileStorage, function (err, resp) {
            if (err) {
                console.error(err);
                return cb(null, gdata);
            }

            //gdata._fileStorage = resp.id;
            return cb(null, gdata);
        });
    }

}

API.Profile.prototype.createOrUpdateAsset = function(assetReq, cb){
    var self = this;
    if(assetReq._id == null){
        assetReq.createdBy = self._id;
    }
    var am = new AssetManager();
    am.buildAsset(assetReq)
    .then(function(a){
        a.save()
        .then(function(savedAsset){
            cb(null, savedAsset);
        }, function(err){
            cb(err);
        });
    }, function(err){
        cb(err);
    });
}

module.exports = API.Profile;