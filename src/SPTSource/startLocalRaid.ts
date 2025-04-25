import { IStartLocalRaidRequestData } from "@spt/models/eft/match/IStartLocalRaidRequestData";
import Helpers from "../helpers/helpers";
import { IStartLocalRaidResponseData } from "@spt/models/eft/match/IStartLocalRaidResponseData";
import { ContextVariableType, TransitionType } from "../Definitions/enums";
import { ILocationTransit } from "@spt/models/eft/match/IEndLocalRaidRequestData";
import { ILocationBase } from "@spt/models/eft/common/ILocationBase";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig";
import { IRaidChanges } from "@spt/models/spt/location/IRaidChanges";
import { IPmcData } from "@spt/models/eft/common/IPmcData";

export class SPTStartLocalRaid {
    public static helpers: Helpers;
    public static onRaidStart: (
        pmcData: IPmcData,
        sessionID: string,
        response: IStartLocalRaidResponseData
    ) => void;

    public generateLocationAndLoot = (
        name: string,
        generateLoot?: boolean
    ): ILocationBase => {
        const location = SPTStartLocalRaid.helpers.databaseService.getLocation(name);
        const locationBaseClone = SPTStartLocalRaid.helpers.cloner.clone(location.base);

        // Update datetime property to now
        locationBaseClone.UnixDateTime = SPTStartLocalRaid.helpers.timeUtil.getTimestamp();

        // Don't generate loot for hideout
        if (name === "hideout") {
            return locationBaseClone;
        }

        // Only requested base data, not loot
        if (!generateLoot) {
            return locationBaseClone;
        }

        // Add cusom pmcs to map every time its run
        SPTStartLocalRaid.helpers.pmcWaveGenerator.applyWaveChangesToMap(
            locationBaseClone
        );

        // Adjust raid based on whether this is a scav run
        let locationConfigClone: ILocationConfig | undefined;
        const raidAdjustments = SPTStartLocalRaid.helpers.applicationContext
            .getLatestValue(ContextVariableType.RAID_ADJUSTMENTS)
            ?.getValue<IRaidChanges>();
        if (raidAdjustments) {
            locationConfigClone = SPTStartLocalRaid.helpers.cloner.clone(
                SPTStartLocalRaid.helpers.locationConfig
            ); // Clone values so they can be used to reset originals later
            SPTStartLocalRaid.helpers.raidTimeAdjustmentService.makeAdjustmentsToMap(
                raidAdjustments,
                locationBaseClone
            );
        }

        const staticAmmoDist = SPTStartLocalRaid.helpers.cloner.clone(location.staticAmmo);

        // Create containers and add loot to them
        const staticLoot =
            SPTStartLocalRaid.helpers.locationLootGenerator.generateStaticContainers(
                locationBaseClone,
                staticAmmoDist
            );
        locationBaseClone.Loot.push(...staticLoot);

        // Add dynamic loot to output loot
        const dynamicLootDistClone = SPTStartLocalRaid.helpers.cloner.clone(
            location.looseLoot
        );
        const dynamicSpawnPoints =
            SPTStartLocalRaid.helpers.locationLootGenerator.generateDynamicLoot(
                dynamicLootDistClone,
                staticAmmoDist,
                name.toLowerCase()
            );

        // Push chosen spawn points into returned object
        for (const spawnPoint of dynamicSpawnPoints) {
            locationBaseClone.Loot.push(spawnPoint);
        }

        // Done generating, log results
        SPTStartLocalRaid.helpers.logger.success(
            SPTStartLocalRaid.helpers.localisationService.getText(
                "location-dynamic_items_spawned_success",
                dynamicSpawnPoints.length
            )
        );
        SPTStartLocalRaid.helpers.logger.success(
            SPTStartLocalRaid.helpers.localisationService.getText(
                "location-generated_success",
                name
            )
        );

        // Reset loot multipliers back to original values
        if (raidAdjustments && locationConfigClone) {
            SPTStartLocalRaid.helpers.logger.debug(
                "Resetting loot multipliers back to their original values"
            );
            SPTStartLocalRaid.helpers.locationConfig.staticLootMultiplier =
                locationConfigClone.staticLootMultiplier;
            SPTStartLocalRaid.helpers.locationConfig.looseLootMultiplier =
                locationConfigClone.looseLootMultiplier;

            SPTStartLocalRaid.helpers.applicationContext.clearValues(
                ContextVariableType.RAID_ADJUSTMENTS
            );
        }

        return locationBaseClone;
    };

    public adjustBotHostilitySettings = (location: ILocationBase) => {
        for (const botId in SPTStartLocalRaid.helpers.pmcConfig.hostilitySettings) {
            const configHostilityChanges =
                SPTStartLocalRaid.helpers.pmcConfig.hostilitySettings[botId];
            const locationBotHostilityDetails =
                location.BotLocationModifier.AdditionalHostilitySettings.find(
                    (botSettings) => botSettings.BotRole.toLowerCase() === botId
                );

            // No matching bot in config, skip
            if (!locationBotHostilityDetails) {
                SPTStartLocalRaid.helpers.logger.warning(
                    `No bot: ${botId} hostility values found on: ${location.Id}, can only edit existing. Skipping`
                );

                continue;
            }

            // Add new permanent enemies if they don't already exist
            if (configHostilityChanges.additionalEnemyTypes) {
                for (const enemyTypeToAdd of configHostilityChanges.additionalEnemyTypes) {
                    if (
                        !locationBotHostilityDetails.AlwaysEnemies.includes(enemyTypeToAdd)
                    ) {
                        locationBotHostilityDetails.AlwaysEnemies.push(enemyTypeToAdd);
                    }
                }
            }

            // Add/edit chance settings
            if (configHostilityChanges.chancedEnemies) {
                locationBotHostilityDetails.ChancedEnemies ||= [];
                for (const chanceDetailsToApply of configHostilityChanges.chancedEnemies) {
                    const locationBotDetails =
                        locationBotHostilityDetails.ChancedEnemies.find(
                            (botChance) => botChance.Role === chanceDetailsToApply.Role
                        );
                    if (locationBotDetails) {
                        // Existing
                        locationBotDetails.EnemyChance = chanceDetailsToApply.EnemyChance;
                    } else {
                        // Add new
                        locationBotHostilityDetails.ChancedEnemies.push(
                            chanceDetailsToApply
                        );
                    }
                }
            }

            // Add new permanent friends if they don't already exist
            if (configHostilityChanges.additionalFriendlyTypes) {
                locationBotHostilityDetails.AlwaysFriends ||= [];
                for (const friendlyTypeToAdd of configHostilityChanges.additionalFriendlyTypes) {
                    if (
                        !locationBotHostilityDetails.AlwaysFriends.includes(
                            friendlyTypeToAdd
                        )
                    ) {
                        locationBotHostilityDetails.AlwaysFriends.push(friendlyTypeToAdd);
                    }
                }
            }

            // Adjust vs bear hostility chance
            if (typeof configHostilityChanges.bearEnemyChance !== "undefined") {
                locationBotHostilityDetails.BearEnemyChance =
                    configHostilityChanges.bearEnemyChance;
            }

            // Adjust vs usec hostility chance
            if (typeof configHostilityChanges.usecEnemyChance !== "undefined") {
                locationBotHostilityDetails.UsecEnemyChance =
                    configHostilityChanges.usecEnemyChance;
            }

            // Adjust vs savage hostility chance
            if (typeof configHostilityChanges.savageEnemyChance !== "undefined") {
                locationBotHostilityDetails.SavageEnemyChance =
                    configHostilityChanges.savageEnemyChance;
            }

            // Adjust vs scav hostility behaviour
            if (typeof configHostilityChanges.savagePlayerBehaviour !== "undefined") {
                locationBotHostilityDetails.SavagePlayerBehaviour =
                    configHostilityChanges.savagePlayerBehaviour;
            }
        }
    };

    public adjustExtracts = (
        playerSide: string,
        location: string,
        locationData: ILocationBase
    ) => {
        const playerIsScav = playerSide.toLowerCase() === "savage";
        if (playerIsScav) {
            // Get relevant extract data for map
            const mapExtracts =
                SPTStartLocalRaid.helpers.databaseService.getLocation(
                    location
                )?.allExtracts;
            if (!mapExtracts) {
                SPTStartLocalRaid.helpers.logger.warning(
                    `Unable to find map: ${location} extract data, no adjustments made`
                );

                return;
            }

            // Find only scav extracts and overwrite existing exits with them
            const scavExtracts = mapExtracts.filter((extract) =>
                ["scav"].includes(extract.Side!.toLowerCase())
            );
            if (scavExtracts.length > 0) {
                // Scav extracts found, use them
                locationData.exits.push(...scavExtracts);
            }
        }
    };

    public startLocalRaid = (
        sessionId: string,
        request: IStartLocalRaidRequestData
    ): IStartLocalRaidResponseData => {
        SPTStartLocalRaid.helpers.logger.debug(`Starting: ${request.location}`);

        const playerProfile =
            SPTStartLocalRaid.helpers.profileHelper.getPmcProfile(sessionId)!;

        // Set interval times to in-raid value
        SPTStartLocalRaid.helpers.ragfairConfig.runIntervalSeconds =
            SPTStartLocalRaid.helpers.ragfairConfig.runIntervalValues.inRaid;
        SPTStartLocalRaid.helpers.hideoutConfig.runIntervalSeconds =
            SPTStartLocalRaid.helpers.hideoutConfig.runIntervalValues.inRaid;

        const result: IStartLocalRaidResponseData = {
            serverId: `${request.location}.${
                request.playerSide
            }.${SPTStartLocalRaid.helpers.timeUtil.getTimestamp()}`, // TODO - does this need to be more verbose - investigate client?
            serverSettings:
                SPTStartLocalRaid.helpers.databaseService.getLocationServices(), // TODO - is this per map or global?
            profile: { insuredItems: playerProfile.InsuredItems },
            locationLoot: this.generateLocationAndLoot(
                request.location,
                !request.sptSkipLootGeneration
            ),
            transitionType: TransitionType.None,
            transition: {
                transitionType: TransitionType.None,
                transitionRaidId: SPTStartLocalRaid.helpers.hashUtil.generate(),
                transitionCount: 0,
                visitedLocations: [],
            },
        };

        // Only has value when transitioning into map from previous one
        if (request.transition) {
            // TODO - why doesnt the raid after transit have any transit data?
            result.transition = request.transition;
        }

        // Get data stored at end of previous raid (if any)
        const transitionData = SPTStartLocalRaid.helpers.applicationContext
            .getLatestValue(ContextVariableType.TRANSIT_INFO)
            ?.getValue<ILocationTransit>();
        if (transitionData) {
            SPTStartLocalRaid.helpers.logger.success(
                `Player: ${sessionId} is in transit to ${request.location}`
            );
            result.transition.transitionType = TransitionType.Common;
            result.transition.transitionRaidId = transitionData.transitionRaidId;
            result.transition.transitionCount += 1;

            // Used by client to determine infil location) - client adds the map player is transiting to later
            result.transition.visitedLocations.push(transitionData.sptLastVisitedLocation);

            // Complete, clean up as no longer needed
            SPTStartLocalRaid.helpers.applicationContext.clearValues(
                ContextVariableType.TRANSIT_INFO
            );
        }

        // Apply changes from pmcConfig to bot hostility values
        this.adjustBotHostilitySettings(result.locationLoot);

        this.adjustExtracts(request.playerSide, request.location, result.locationLoot);

        // Clear bot cache ready for a fresh raid
        SPTStartLocalRaid.helpers.botGenerationCacheService.clearStoredBots();
        SPTStartLocalRaid.helpers.botNameService.clearNameCache();

        //            \\
        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\
        //            \\

        SPTStartLocalRaid.onRaidStart(playerProfile, sessionId, result);

        //            \\
        //            \\
        //            \\
        //            \\
        //            \\
        //            \\

        return result;
    };
}
