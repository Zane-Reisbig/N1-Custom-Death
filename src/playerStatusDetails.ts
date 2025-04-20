import { ILocation } from "@spt/models/eft/common/ILocation";
import Helpers from "./helpers";
import { SessionDetails } from "./originalEndRaid";

enum ExitStatus {
    KILLED = "Killed",
    LEFT = "Left",
    MISSINGINACTION = "MissingInAction",
    RUNNER = "Runner",
    SURVIVED = "Survived",
    TRANSIT = "Transit",
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
        this.isDead = [ExitStatus.KILLED, ExitStatus.LEFT, ExitStatus.RUNNER]
                        .includes(details.request.results.result);
        this.isTransfer = details.request.results.result === ExitStatus.TRANSIT;
        this.isSurvived = details.request.results.result === ExitStatus.SURVIVED;
    }
}
