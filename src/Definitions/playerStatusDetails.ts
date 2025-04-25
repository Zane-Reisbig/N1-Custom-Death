import Helpers from "../helpers/helpers";

import { ILocation } from "@spt/models/eft/common/ILocation";
import { IEndLocalRaidRequestData } from "@spt/models/eft/match/IEndLocalRaidRequestData";
import { ExitStatus } from "./enums";

export interface SessionDetails {
    sessionId: string;
    request: IEndLocalRaidRequestData;
    playerDetails: PlayerStatusDetails;
}

export default class PlayerStatusDetails {
    static helpers: Helpers;

    serverID: string;
    locationName: string;
    isPMC: boolean;
    mapBase: ILocation; // todo
    isDead: boolean;
    isTransfer: boolean;
    isSurvived: boolean;

    constructor(details: SessionDetails) {
        this.serverID = details.request.serverId;

        // ServerId has various info stored in it, delimited by a period
        const tokens = this.serverID.split(".");

        this.locationName = tokens[0].toLowerCase();
        this.mapBase = PlayerStatusDetails.helpers.databaseService.getLocation(
            this.locationName
        );
        this.isPMC = tokens[1].toLowerCase() === "pmc";

        // prettier-ignore
        this.isDead = [ExitStatus.KILLED, ExitStatus.LEFT]
                        .includes(details.request.results.result);
        this.isTransfer = details.request.results.result === ExitStatus.TRANSIT;
        this.isSurvived = details.request.results.result === ExitStatus.SURVIVED;
    }
}
