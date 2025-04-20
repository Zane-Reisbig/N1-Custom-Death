"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExitStatus;
(function (ExitStatus) {
    ExitStatus["KILLED"] = "Killed";
    ExitStatus["LEFT"] = "Left";
    ExitStatus["MISSINGINACTION"] = "MissingInAction";
    ExitStatus["RUNNER"] = "Runner";
    ExitStatus["SURVIVED"] = "Survived";
    ExitStatus["TRANSIT"] = "Transit";
})(ExitStatus || (ExitStatus = {}));
class PlayerStatusDetails {
    static helpers;
    serverID;
    locationName;
    isPMC;
    mapBase; // todo
    isDead;
    isTransfer;
    isSurvived;
    constructor(details) {
        this.serverID = details.request.serverId;
        // ServerId has various info stored in it, delimited by a period
        const tokens = this.serverID.split(".");
        this.locationName = tokens[0].toLowerCase();
        this.mapBase = PlayerStatusDetails.helpers.databaseService.getLocation(this.locationName);
        this.isPMC = tokens[1].toLowerCase() === "pmc";
        // prettier-ignore
        this.isDead = [ExitStatus.KILLED, ExitStatus.LEFT, ExitStatus.RUNNER]
            .includes(details.request.results.result);
        this.isTransfer = details.request.results.result === ExitStatus.TRANSIT;
        this.isSurvived = details.request.results.result === ExitStatus.SURVIVED;
    }
}
exports.default = PlayerStatusDetails;
