"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("./enums");
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
        this.isDead = [enums_1.ExitStatus.KILLED, enums_1.ExitStatus.LEFT]
            .includes(details.request.results.result);
        this.isTransfer = details.request.results.result === enums_1.ExitStatus.TRANSIT;
        this.isSurvived = details.request.results.result === enums_1.ExitStatus.SURVIVED;
    }
}
exports.default = PlayerStatusDetails;
