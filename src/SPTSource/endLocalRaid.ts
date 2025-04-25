import Helpers from "../helpers/helpers";
import ItemTransferHelper from "../helpers/itemTransferHelper";
import PlayerStatusDetails, { SessionDetails } from "../Definitions/playerStatusDetails";
import {
    ContextVariableType,
    CustomisationSource,
    MessageType,
    QuestStatus,
    Traders,
} from "../Definitions/enums";

import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IQuestStatus, ITraderInfo } from "@spt/models/eft/common/tables/IBotBase";
import { ISptProfile } from "@spt/models/eft/profile/ISptProfile";
import { IEndLocalRaidRequestData } from "@spt/models/eft/match/IEndLocalRaidRequestData";
import { IItem } from "@spt/models/eft/common/tables/IItem";

import * as config from "../config.json";
import InventoryHelpers from "../helpers/inventoryHelpers";

export class SPTEndLocalRaid {
    public static helpers: Helpers;

    public static onPMCDeath: (playerPMC: IPmcData, sessionID: string) => void;
    public static onScavDeath: (playerScav: IPmcData, sessionID: string) => void;

    public applyTraderStandingAdjustments = (
        tradersServerProfile: Record<string, ITraderInfo>,
        tradersClientProfile: Record<string, ITraderInfo>
    ) => {
        for (const traderId in tradersClientProfile) {
            const serverProfileTrader = tradersServerProfile[traderId];
            const clientProfileTrader = tradersClientProfile[traderId];
            if (!(serverProfileTrader && clientProfileTrader)) {
                continue;
            }

            if (clientProfileTrader.standing !== serverProfileTrader.standing) {
                // Difference found, update server profile with values from client profile
                tradersServerProfile[traderId].standing = clientProfileTrader.standing;
            }
        }
    };

    public migrateScavQuestProgressToPmcProfile = (
        scavProfile: IPmcData,
        pmcProfile: IPmcData
    ) => {
        for (const scavQuest of scavProfile.Quests) {
            const pmcQuest = pmcProfile.Quests.find(
                (quest) => quest.qid === scavQuest.qid
            );
            if (!pmcQuest) {
                SPTEndLocalRaid.helpers.logger.warning(
                    SPTEndLocalRaid.helpers.localisationService.getText(
                        "inraid-unable_to_migrate_pmc_quest_not_found_in_profile",
                        scavQuest.qid
                    )
                );
                continue;
            }

            // Get counters related to scav quest
            const matchingCounters = Object.values(
                scavProfile.TaskConditionCounters
            ).filter((counter) => counter.sourceId === scavQuest.qid);

            if (!matchingCounters) {
                continue;
            }

            // insert scav quest counters into pmc profile
            for (const counter of matchingCounters) {
                pmcProfile.TaskConditionCounters[counter.id] = counter;
            }

            // Find Matching PMC Quest
            // Update Status and StatusTimer properties
            pmcQuest.status = scavQuest.status;
            pmcQuest.statusTimers = scavQuest.statusTimers;
        }
    };

    public mergePmcAndScavEncyclopedias = (primary: IPmcData, secondary: IPmcData) => {
        function extend(
            target: { [key: string]: boolean },
            source: Record<string, boolean>
        ) {
            for (const key in source) {
                if (Object.hasOwn(source, key)) {
                    target[key] = source[key];
                }
            }
            return target;
        }

        const merged = extend(extend({}, primary.Encyclopedia), secondary.Encyclopedia);
        primary.Encyclopedia = merged;
        secondary.Encyclopedia = merged;
    };

    public handlePostRaidPlayerScav = (
        sessionDetails: SessionDetails,
        pmcProfile: IPmcData,
        scavProfile: IPmcData,
        isDead: boolean,
        isTransfer: boolean,
        request: IEndLocalRaidRequestData
    ) => {
        const postRaidProfile = request.results.profile;

        if (isTransfer) {
            // We want scav inventory to persist into next raid when pscav is moving between maps
            SPTEndLocalRaid.helpers.inRaidHelper.setInventory(
                sessionDetails.sessionId,
                scavProfile,
                postRaidProfile,
                true,
                isTransfer
            );
        }

        scavProfile.Info.Level = request.results.profile.Info.Level;
        scavProfile.Skills = request.results.profile.Skills;
        scavProfile.Stats = request.results.profile.Stats;
        scavProfile.Encyclopedia = request.results.profile.Encyclopedia;
        scavProfile.TaskConditionCounters = request.results.profile.TaskConditionCounters;
        scavProfile.SurvivorClass = request.results.profile.SurvivorClass;

        // Scavs dont have achievements, but copy anyway
        scavProfile.Achievements = request.results.profile.Achievements;

        scavProfile.Info.Experience = request.results.profile.Info.Experience;

        // Must occur after experience is set and stats copied over
        scavProfile.Stats.Eft!.TotalSessionExperience = 0;

        this.applyTraderStandingAdjustments(
            scavProfile.TradersInfo,
            request.results.profile.TradersInfo
        );

        // Clamp fence standing within -7 to 15 range
        const fenceMax = SPTEndLocalRaid.helpers.traderConfig.fence.playerRepMax; // 15
        const fenceMin = SPTEndLocalRaid.helpers.traderConfig.fence.playerRepMin; //-7
        const currentFenceStanding =
            request.results.profile.TradersInfo[Traders.FENCE].standing;
        scavProfile.TradersInfo[Traders.FENCE].standing = Math.min(
            Math.max(currentFenceStanding, fenceMin),
            fenceMax
        );

        // Successful extract as scav, give some rep
        if (
            sessionDetails.playerDetails.isSurvived &&
            scavProfile.TradersInfo[Traders.FENCE].standing < fenceMax
        ) {
            scavProfile.TradersInfo[Traders.FENCE].standing +=
                SPTEndLocalRaid.helpers.inRaidConfig.scavExtractStandingGain;
        }

        // Copy scav fence values to PMC profile
        pmcProfile.TradersInfo[Traders.FENCE] = scavProfile.TradersInfo[Traders.FENCE];

        if (scavProfile.TaskConditionCounters) {
            // Scav quest progress needs to be moved to pmc so player can see it in menu / hand them in
            this.migrateScavQuestProgressToPmcProfile(scavProfile, pmcProfile);
        }

        // Must occur after encyclopedia updated
        this.mergePmcAndScavEncyclopedias(scavProfile, pmcProfile);

        // Remove skill fatigue values
        for (const skill of scavProfile.Skills.Common) {
            skill.PointsEarnedDuringSession = 0.0;
        }

        // Scav died, regen scav loadout and reset timer
        if (isDead) {
            SPTEndLocalRaid.helpers.playerScavGenerator.generate(sessionDetails.sessionId);
        }

        // Update last played property
        pmcProfile.Info.LastTimePlayedAsSavage =
            SPTEndLocalRaid.helpers.timeUtil.getTimestamp();

        //            \\
        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\
        //            \\

        if (SPTEndLocalRaid.onScavDeath && isDead) {
            // I don't know why but if I don't refresh the reference to the scav profile here it doesn't work
            const scavProfileRef = SPTEndLocalRaid.helpers.profileHelper.getScavProfile(
                sessionDetails.sessionId
            );

            SPTEndLocalRaid.onScavDeath(scavProfileRef, sessionDetails.sessionId);
        }

        //            \\
        //            \\
        //            \\
        //            \\
        //            \\
        //            \\

        // Force a profile save
        SPTEndLocalRaid.helpers.saveServer.saveProfile(sessionDetails.sessionId);
    };

    public processAchievementRewards = (
        fullProfile: ISptProfile,
        postRaidAchievements: Record<string, number>
    ) => {
        const sessionId = fullProfile.info.id;
        const pmcProfile = fullProfile.characters.pmc;
        const preRaidAchievementIds = Object.keys(fullProfile.characters.pmc.Achievements);
        const postRaidAchievementIds = Object.keys(postRaidAchievements);
        const achievementIdsAcquiredThisRaid = postRaidAchievementIds.filter(
            (id) => !preRaidAchievementIds.includes(id)
        );

        // Get achievement data from db
        const achievementsDb =
            SPTEndLocalRaid.helpers.databaseService.getTemplates().achievements;

        // Map the achievement ids player obtained in raid with matching achievement data from db
        const achievements = achievementIdsAcquiredThisRaid.map((achievementId) =>
            achievementsDb.find((achievementDb) => achievementDb.id === achievementId)
        );
        if (!achievements) {
            // No achievements found
            return;
        }

        for (const achievement of achievements) {
            const rewardItems = SPTEndLocalRaid.helpers.rewardHelper.applyRewards(
                achievement!.rewards,
                CustomisationSource.ACHIEVEMENT,
                fullProfile,
                pmcProfile,
                achievement!.id
            );
            if (rewardItems?.length > 0) {
                SPTEndLocalRaid.helpers.mailSendService.sendLocalisedSystemMessageToPlayer(
                    sessionId,
                    "670547bb5fa0b1a7c30d5836 0",
                    rewardItems,
                    [],
                    SPTEndLocalRaid.helpers.timeUtil.getHoursAsSeconds(24 * 7)
                );
            }
        }
    };

    public processPostRaidQuests = (questsToProcess: IQuestStatus[]): IQuestStatus[] => {
        for (const quest of questsToProcess) {
            quest.status = Number(QuestStatus[quest.status]);

            //                         \\
            //                         \\
            //                         \\
            //
            // Arcade Mode Author Note -
            // This is just not typesafe no matter which way you slice it
            //
            //                         \\
            //                         \\
            //                         \\

            // Iterate over each status timer key and convert from a string into the enums number value
            for (const statusTimerKey in quest.statusTimers) {
                if (Number.isNaN(Number.parseInt(statusTimerKey))) {
                    // Is a string, convert

                    //@ts-expect-error this is typed wrong on the SPT side
                    quest.statusTimers[QuestStatus[statusTimerKey]] =
                        quest.statusTimers[statusTimerKey];

                    // Delete the old string key/value
                    //@ts-expect-error as is this
                    quest.statusTimers[statusTimerKey] = undefined;
                }
            }
        }

        // Find marked as failed quests + flagged as restartable and re-status them as 'failed' so they can be restarted by player
        const failedQuests = questsToProcess.filter(
            (quest) => quest.status === QuestStatus.MarkedAsFailed
        );
        for (const failedQuest of failedQuests) {
            const dbQuest =
                SPTEndLocalRaid.helpers.databaseService.getQuests()[failedQuest.qid];
            if (!dbQuest) {
                continue;
            }

            if (dbQuest.restartable) {
                failedQuest.status = QuestStatus.Fail;
            }
        }

        return questsToProcess;
    };

    public lightkeeperQuestWorkaround = (
        sessionId: string,
        postRaidQuests: IQuestStatus[],
        preRaidQuests: IQuestStatus[],
        pmcProfile: IPmcData
    ) => {
        // LK quests that were not completed before raid but now are
        const newlyCompletedLightkeeperQuests = postRaidQuests.filter(
            (postRaidQuest) =>
                postRaidQuest.status === QuestStatus.Success &&
                preRaidQuests.find(
                    (preRaidQuest) =>
                        preRaidQuest.qid === postRaidQuest.qid &&
                        preRaidQuest.status !== QuestStatus.Success
                ) &&
                SPTEndLocalRaid.helpers.databaseService.getQuests()[postRaidQuest.qid]
                    ?.traderId === Traders.LIGHTHOUSEKEEPER
        );

        // Run server complete quest process to ensure player gets rewards
        for (const questToComplete of newlyCompletedLightkeeperQuests) {
            SPTEndLocalRaid.helpers.questHelper.completeQuest(
                pmcProfile,
                {
                    Action: "CompleteQuest",
                    qid: questToComplete.qid,
                    removeExcessItems: false,
                },
                sessionId
            );
        }
    };

    public handleInsuredItemLostEvent = (
        sessionId: string,
        preRaidPmcProfile: IPmcData,
        request: IEndLocalRaidRequestData,
        locationName: string
    ) => {
        if (request.lostInsuredItems?.length > 0) {
            const mappedItems =
                SPTEndLocalRaid.helpers.insuranceService.mapInsuredItemsToTrader(
                    sessionId,
                    request.lostInsuredItems,
                    preRaidPmcProfile
                );

            // Is possible to have items in lostInsuredItems but removed before reaching mappedItems
            if (mappedItems.length === 0) {
                return;
            }

            SPTEndLocalRaid.helpers.insuranceService.storeGearLostInRaidToSendLater(
                sessionId,
                mappedItems
            );

            SPTEndLocalRaid.helpers.insuranceService.startPostRaidInsuranceLostProcess(
                preRaidPmcProfile,
                sessionId,
                locationName
            );
        }
    };

    public checkForAndFixPickupQuestsAfterDeath = (
        sessionId: string,
        lostQuestItems: IItem[],
        profileQuests: IQuestStatus[]
    ) => {
        // Exclude completed quests
        const activeQuestIdsInProfile = profileQuests
            .filter(
                (quest) =>
                    ![QuestStatus.Success, QuestStatus.AvailableForStart].includes(
                        quest.status
                    )
            )
            .map((status) => status.qid);

        // Get db details of quests we found above
        const questDb = Object.values(
            SPTEndLocalRaid.helpers.databaseService.getQuests()
        ).filter((quest) => activeQuestIdsInProfile.includes(quest._id));

        for (const lostItem of lostQuestItems) {
            let matchingConditionId: string;
            // Find a quest that has a FindItem condition that has the list items tpl as a target
            const matchingQuests = questDb.filter((quest) => {
                const matchingCondition = quest.conditions.AvailableForFinish.find(
                    (questCondition) =>
                        questCondition.conditionType === "FindItem" &&
                        questCondition.target!.includes(lostItem._tpl)
                );
                if (!matchingCondition) {
                    // Quest doesnt have a matching condition
                    return false;
                }

                // We found a condition, save id for later
                matchingConditionId = matchingCondition.id;
                return true;
            });

            // Fail if multiple were found
            if (matchingQuests.length !== 1) {
                SPTEndLocalRaid.helpers.logger.error(
                    `Unable to fix quest item: ${lostItem}, ${matchingQuests.length} matching quests found, expected 1`
                );

                continue;
            }

            const matchingQuest = matchingQuests[0];
            // We have a match, remove the condition id from profile to reset progress and let player pick item up again
            const profileQuestToUpdate: IQuestStatus = profileQuests.find(
                (questStatus) => questStatus.qid === matchingQuest._id
            ) as IQuestStatus;

            if (!profileQuestToUpdate) {
                // Profile doesnt have a matching quest
                continue;
            }

            // Filter out the matching condition we found
            profileQuestToUpdate.completedConditions =
                profileQuestToUpdate.completedConditions!.filter(
                    (conditionId) => conditionId !== matchingConditionId
                );
        }
    };

    public getFenceStandingAfterExtract = (
        pmcData: IPmcData,
        baseGain: number,
        extractCount: number
    ): number => {
        // Get current standing
        const fenceId: string = Traders.FENCE;
        let fenceStanding = Number(pmcData.TradersInfo[fenceId].standing);

        // get standing after taking extract x times, x.xx format, gain from extract can be no smaller than 0.01
        fenceStanding += Math.max(baseGain / extractCount, 0.01);

        // Ensure fence loyalty level is not above/below the range -7 to 15
        const newFenceStanding = Math.min(Math.max(fenceStanding, -7), 15);
        SPTEndLocalRaid.helpers.logger.debug(
            `Old vs new fence standing: ${pmcData.TradersInfo[fenceId].standing}, ${newFenceStanding}`
        );

        return Number(newFenceStanding.toFixed(2));
    };

    public handleCarExtract = (
        extractName: string,
        pmcData: IPmcData,
        sessionId: string
    ) => {
        // Ensure key exists for extract
        if (!(extractName in pmcData.CarExtractCounts)) {
            pmcData.CarExtractCounts[extractName] = 0;
        }

        // Increment extract count value
        pmcData.CarExtractCounts[extractName] += 1;

        // Not exact replica of Live behaviour
        // Simplified for now, no real reason to do the whole (unconfirmed) extra 0.01 standing per day regeneration mechanic
        const newFenceStanding = this.getFenceStandingAfterExtract(
            pmcData,
            SPTEndLocalRaid.helpers.inRaidConfig.carExtractBaseStandingGain,
            pmcData.CarExtractCounts[extractName]
        );
        const fenceId: string = Traders.FENCE;
        pmcData.TradersInfo[fenceId].standing = newFenceStanding;

        // Check if new standing has leveled up trader
        SPTEndLocalRaid.helpers.traderHelper.lvlUp(fenceId, pmcData);
        pmcData.TradersInfo[fenceId].loyaltyLevel = Math.max(
            pmcData.TradersInfo[fenceId].loyaltyLevel!,
            1
        );

        SPTEndLocalRaid.helpers.logger.debug(
            `Car extract: ${extractName} used, total times taken: ${pmcData.CarExtractCounts[extractName]}`
        );

        // Copy updated fence rep values into scav profile to ensure consistency
        const scavData: IPmcData =
            SPTEndLocalRaid.helpers.profileHelper.getScavProfile(sessionId);
        scavData.TradersInfo[fenceId].standing = pmcData.TradersInfo[fenceId].standing;
        scavData.TradersInfo[fenceId].loyaltyLevel =
            pmcData.TradersInfo[fenceId].loyaltyLevel;
    };

    public handleCoopExtract = (
        sessionId: string,
        pmcData: IPmcData,
        extractName: string
    ) => {
        pmcData.CoopExtractCounts ||= {};

        // Ensure key exists for extract
        if (!(extractName in pmcData.CoopExtractCounts)) {
            pmcData.CoopExtractCounts[extractName] = 0;
        }

        // Increment extract count value
        pmcData.CoopExtractCounts[extractName] += 1;

        // Get new fence standing value
        const newFenceStanding = this.getFenceStandingAfterExtract(
            pmcData,
            SPTEndLocalRaid.helpers.inRaidConfig.coopExtractBaseStandingGain,
            pmcData.CoopExtractCounts[extractName]
        );
        const fenceId: string = Traders.FENCE;
        pmcData.TradersInfo[fenceId].standing = newFenceStanding;

        // Check if new standing has leveled up trader
        SPTEndLocalRaid.helpers.traderHelper.lvlUp(fenceId, pmcData);
        pmcData.TradersInfo[fenceId].loyaltyLevel = Math.max(
            pmcData.TradersInfo[fenceId].loyaltyLevel!,
            1
        );

        // Copy updated fence rep values into scav profile to ensure consistency
        const scavData: IPmcData =
            SPTEndLocalRaid.helpers.profileHelper.getScavProfile(sessionId);
        scavData.TradersInfo[fenceId].standing = pmcData.TradersInfo[fenceId].standing;
        scavData.TradersInfo[fenceId].loyaltyLevel =
            pmcData.TradersInfo[fenceId].loyaltyLevel;
    };

    public sendCoopTakenFenceMessage = (sessionId: string) => {
        // Generate reward for taking coop extract
        const loot = SPTEndLocalRaid.helpers.lootGenerator.createRandomLoot(
            SPTEndLocalRaid.helpers.traderConfig.fence.coopExtractGift
        );
        const mailableLoot: IItem[] = [];

        const parentId = SPTEndLocalRaid.helpers.hashUtil.generate();
        for (const item of loot) {
            item.parentId = parentId;
            mailableLoot.push(item);
        }

        // Send message from fence giving player reward generated above
        SPTEndLocalRaid.helpers.mailSendService.sendLocalisedNpcMessageToPlayer(
            sessionId,
            SPTEndLocalRaid.helpers.traderHelper.getTraderById(Traders.FENCE as string)!,
            MessageType.MESSAGE_WITH_ITEMS,
            SPTEndLocalRaid.helpers.randomUtil.getArrayValue(
                SPTEndLocalRaid.helpers.traderConfig.fence.coopExtractGift.messageLocaleIds
            ),
            mailableLoot,
            SPTEndLocalRaid.helpers.timeUtil.getHoursAsSeconds(
                SPTEndLocalRaid.helpers.traderConfig.fence.coopExtractGift.giftExpiryHours
            )
        );
    };

    public setInventory = (
        sessionID: string,
        serverProfile: IPmcData,
        postRaidProfile: IPmcData,
        isSurvived: boolean,
        isTransfer: boolean
    ) => {
        // Store insurance (as removeItem() removes insured items)
        const insured = SPTEndLocalRaid.helpers.cloner.clone(serverProfile.InsuredItems);

        // Remove equipment and loot items stored on player from server profile in preparation for data from client being added
        SPTEndLocalRaid.helpers.sptInventoryHelper.removeItem(
            serverProfile,
            serverProfile.Inventory.equipment,
            sessionID
        );

        // Remove quest items stored on player from server profile in preparation for data from client being added
        SPTEndLocalRaid.helpers.sptInventoryHelper.removeItem(
            serverProfile,
            serverProfile.Inventory.questRaidItems,
            sessionID
        );

        // Get all items that have a parent of `serverProfile.Inventory.equipment` (All items player had on them at end of raid)
        const postRaidInventoryItems =
            SPTEndLocalRaid.helpers.itemHelper.findAndReturnChildrenAsItems(
                postRaidProfile.Inventory.items,
                postRaidProfile.Inventory.equipment
            );

        // Get all items that have a parent of `serverProfile.Inventory.questRaidItems` (Quest items player had on them at end of raid)
        const postRaidQuestItems =
            SPTEndLocalRaid.helpers.itemHelper.findAndReturnChildrenAsItems(
                postRaidProfile.Inventory.items,
                postRaidProfile.Inventory.questRaidItems
            );

        //            //
        //            //
        // MOD SOURCE //
        //            //
        //            //

        // // Handle Removing of FIR status if player did not survive + not transferring
        // // Do after above filtering code to reduce work done
        // if (
        //     !isSurvived &&
        //     !isTransfer &&
        //     !SPTEndLocalRaid.helpers.inRaidConfig.alwaysKeepFoundInRaidOnRaidEnd
        // ) {
        //     this.removeFiRStatusFromCertainItems(postRaidProfile.Inventory.items);
        // }

        //            //
        //            //
        //            //
        //            //
        //            //

        // Add items from client profile into server profile
        this.addItemsToInventory(postRaidInventoryItems, serverProfile.Inventory.items);

        // Add quest items from client profile into server profile
        this.addItemsToInventory(postRaidQuestItems, serverProfile.Inventory.items);

        serverProfile.Inventory.fastPanel = postRaidProfile.Inventory.fastPanel; // Quick access items bar
        serverProfile.InsuredItems = insured;
    };

    public addItemsToInventory = (itemsToAdd: IItem[], serverInventoryItems: IItem[]) => {
        for (const itemToAdd of itemsToAdd) {
            // Try to find index of item to determine if we should add or replace
            const existingItemIndex = serverInventoryItems.findIndex(
                (inventoryItem) => inventoryItem._id === itemToAdd._id
            );
            if (existingItemIndex === -1) {
                // Not found, add
                serverInventoryItems.push(itemToAdd);
            } else {
                // Replace item with one from client
                serverInventoryItems.splice(existingItemIndex, 1, itemToAdd);
            }
        }
    };

    public sptSetInventory = (
        sessionID: string,
        serverProfile: IPmcData,
        postRaidProfile: IPmcData,
        isSurvived: boolean,
        isTransfer: boolean
    ) => {
        // Store insurance (as removeItem() removes insured items)
        const insured = SPTEndLocalRaid.helpers.cloner.clone(serverProfile.InsuredItems);

        // Remove equipment and loot items stored on player from server profile in preparation for data from client being added
        SPTEndLocalRaid.helpers.sptInventoryHelper.removeItem(
            serverProfile,
            serverProfile.Inventory.equipment,
            sessionID
        );

        // Remove quest items stored on player from server profile in preparation for data from client being added
        SPTEndLocalRaid.helpers.sptInventoryHelper.removeItem(
            serverProfile,
            serverProfile.Inventory.questRaidItems,
            sessionID
        );

        // Get all items that have a parent of `serverProfile.Inventory.equipment` (All items player had on them at end of raid)
        const postRaidInventoryItems =
            SPTEndLocalRaid.helpers.itemHelper.findAndReturnChildrenAsItems(
                postRaidProfile.Inventory.items,
                postRaidProfile.Inventory.equipment
            );

        // Get all items that have a parent of `serverProfile.Inventory.questRaidItems` (Quest items player had on them at end of raid)
        const postRaidQuestItems =
            SPTEndLocalRaid.helpers.itemHelper.findAndReturnChildrenAsItems(
                postRaidProfile.Inventory.items,
                postRaidProfile.Inventory.questRaidItems
            );

        //            \\
        //            \\
        //            \\
        // Mod Source \\
        //            \\
        //            \\
        //            \\

        // Just these lines commented out
        // Despite saying "CertainItems" in the method name, it does it to all of em'

        // // Handle Removing of FIR status if player did not survive + not transferring
        // // Do after above filtering code to reduce work done
        // if (
        //     !isSurvived &&
        //     !isTransfer &&
        //     !SPTEndLocalRaid.helpers.inRaidConfig.alwaysKeepFoundInRaidOnRaidEnd
        // ) {
        //     this.removeFiRStatusFromCertainItems(postRaidProfile.Inventory.items);
        // }

        //            \\
        //            \\
        //            \\
        // Mod Source \\
        //            \\
        //            \\
        //            \\

        // Add items from client profile into server profile
        this.addItemsToInventory(postRaidInventoryItems, serverProfile.Inventory.items);

        // Add quest items from client profile into server profile
        this.addItemsToInventory(postRaidQuestItems, serverProfile.Inventory.items);

        serverProfile.Inventory.fastPanel = postRaidProfile.Inventory.fastPanel; // Quick access items bar
        serverProfile.InsuredItems = insured;
    };

    public postRaidPlayerUSEC = (
        sessionId: string,
        fullProfile: ISptProfile,
        scavProfile: IPmcData,
        isDead: boolean,
        isSurvived: boolean,
        isTransfer: boolean,
        request: IEndLocalRaidRequestData,
        locationName: string
    ) => {
        const pmcProfile = fullProfile.characters.pmc;
        const postRaidProfile = request.results.profile;
        const preRaidProfileQuestDataClone = SPTEndLocalRaid.helpers.cloner.clone(
            pmcProfile.Quests
        );

        // MUST occur BEFORE inventory actions (setInventory()) occur
        // Player died, get quest items they lost for use later
        const lostQuestItems =
            SPTEndLocalRaid.helpers.profileHelper.getQuestItemsInProfile(postRaidProfile);

        // Update inventory
        this.sptSetInventory(
            sessionId,
            pmcProfile,
            postRaidProfile,
            isSurvived,
            isTransfer
        );

        pmcProfile.Info.Level = postRaidProfile.Info.Level;
        pmcProfile.Skills = postRaidProfile.Skills;
        pmcProfile.Stats.Eft = postRaidProfile.Stats.Eft;
        pmcProfile.Encyclopedia = postRaidProfile.Encyclopedia;
        pmcProfile.TaskConditionCounters = postRaidProfile.TaskConditionCounters;
        pmcProfile.SurvivorClass = postRaidProfile.SurvivorClass;

        // MUST occur prior to profile achievements being overwritten by post-raid achievements
        this.processAchievementRewards(fullProfile, postRaidProfile.Achievements);

        pmcProfile.Achievements = postRaidProfile.Achievements;
        pmcProfile.Quests = this.processPostRaidQuests(postRaidProfile.Quests);

        // Handle edge case - must occur AFTER processPostRaidQuests()
        this.lightkeeperQuestWorkaround(
            sessionId,
            postRaidProfile.Quests,
            preRaidProfileQuestDataClone,
            pmcProfile
        );

        pmcProfile.WishList = postRaidProfile.WishList;

        pmcProfile.Info.Experience = postRaidProfile.Info.Experience;

        this.applyTraderStandingAdjustments(
            pmcProfile.TradersInfo,
            postRaidProfile.TradersInfo
        );

        // Must occur AFTER experience is set and stats copied over
        pmcProfile.Stats.Eft!.TotalSessionExperience = 0;

        const fenceId = Traders.FENCE;

        // Clamp fence standing
        const currentFenceStanding = postRaidProfile.TradersInfo[fenceId].standing;
        pmcProfile.TradersInfo[fenceId].standing = Math.min(
            Math.max(currentFenceStanding, -7),
            15
        ); // Ensure it stays between -7 and 15

        // Copy fence values to Scav
        scavProfile.TradersInfo[fenceId] = pmcProfile.TradersInfo[fenceId];

        // MUST occur AFTER encyclopedia updated
        this.mergePmcAndScavEncyclopedias(pmcProfile, scavProfile);

        // Remove skill fatigue values
        for (const skill of scavProfile.Skills.Common) {
            skill.PointsEarnedDuringSession = 0.0;
        }

        // Handle temp, hydration, limb hp/effects
        SPTEndLocalRaid.helpers.healthHelper.updateProfileHealthPostRaid(
            pmcProfile,
            postRaidProfile.Health,
            sessionId,
            isDead
        );

        //            \\
        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\
        //            \\

        // If we revert the items back to the way they were, you couldn't have lost anything
        // !!no dupes!!
        if (!config.OnDeathBehavior.ResetToPreRaidInventory.Enabled) {
            const playerInventoryItemIds = InventoryHelpers.clonePMCInv(pmcProfile).reduce(
                (init, cur) => [...init, cur._id],
                [] as string[]
            );

            // Since we keep items on death all insured items are no longer lost, so we need to amend the raid details
            request.lostInsuredItems = request.lostInsuredItems.filter(
                (i) => !playerInventoryItemIds.includes(i._id)
            );

            // This must occur _BEFORE_ `deleteInventory`, as that method clears insured items
            this.handleInsuredItemLostEvent(sessionId, pmcProfile, request, locationName);
        }

        //            \\
        //            \\
        //            \\
        //            \\
        //            \\
        //            \\

        if (isDead) {
            SPTEndLocalRaid.helpers.logger.log("Player is Dead", "red");

            if (lostQuestItems.length > 0) {
                // MUST occur AFTER quests have post raid quest data has been merged "processPostRaidQuests()"
                // Player is dead + had quest items, check and fix any broken find item quests
                this.checkForAndFixPickupQuestsAfterDeath(
                    sessionId,
                    lostQuestItems,
                    pmcProfile.Quests
                );
            }

            SPTEndLocalRaid.helpers.pmcChatResponseService.sendKillerResponse(
                sessionId,
                pmcProfile,
                postRaidProfile.Stats.Eft!.Aggressor!
            );
        }

        // Must occur AFTER killer messages have been sent
        SPTEndLocalRaid.helpers.matchBotDetailsCacheService.clearCache();

        const victims = postRaidProfile.Stats.Eft!.Victims.filter(
            (victim) => ["pmcbear", "pmcusec"].includes(victim.Role.toLowerCase()) // TODO replace with enum
        );
        if (victims?.length > 0) {
            // Player killed PMCs, send some mail responses to them
            SPTEndLocalRaid.helpers.pmcChatResponseService.sendVictimResponse(
                sessionId,
                victims,
                pmcProfile
            );
        }

        //            \\
        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\
        //            \\

        if (SPTEndLocalRaid.onPMCDeath) {
            SPTEndLocalRaid.onPMCDeath(pmcProfile, sessionId);

            SPTEndLocalRaid.helpers.logger.success("Raid Had been Patched!");
        } else {
            SPTEndLocalRaid.helpers.logger.error(
                "Source was null removing all yo items g"
            );
            SPTEndLocalRaid.helpers.logger.error(
                "For some reason you've re-enabled the original system >:("
            );
            SPTEndLocalRaid.helpers.inRaidHelper.deleteInventory(pmcProfile, sessionId);
            SPTEndLocalRaid.helpers.inRaidHelper.removeFiRStatusFromItemsInContainer(
                sessionId,
                pmcProfile,
                "SecuredContainer"
            );
        }

        //           \\
        //           \\
        //           \\
        //    END    \\
        //           \\
        //           \\
        //           \\
    };

    public static validateMembers(cls: SPTEndLocalRaid) {
        SPTEndLocalRaid.helpers.logger.log(
            `onPMCDeath Hook Status: ${
                SPTEndLocalRaid.onPMCDeath != null ? "Loaded" : "Undefined"
            }`,
            SPTEndLocalRaid.onPMCDeath == null ? "red" : "green"
        );

        SPTEndLocalRaid.helpers.logger.log(
            `onScavDeath Hook Status: ${
                SPTEndLocalRaid.onScavDeath != null ? "Loaded" : "Undefined"
            }`,
            SPTEndLocalRaid.onScavDeath == null ? "red" : "green"
        );

        SPTEndLocalRaid.helpers.logger.log(
            `Custom Post Raid PMC Status: ${
                cls.postRaidPlayerUSEC != null ? "Loaded" : "Undefined"
            }`,
            cls.postRaidPlayerUSEC == null ? "red" : "green"
        );

        SPTEndLocalRaid.helpers.logger.log(
            `End Local Raid Status: ${cls.endLocalRaid != null ? "Loaded" : "Undefined"}`,
            cls.endLocalRaid == null ? "red" : "green"
        );
    }

    public endLocalRaid = (sessionId: string, request: IEndLocalRaidRequestData) => {
        let endRaidPackage: SessionDetails = {
            sessionId: sessionId,
            request: request,

            //@ts-ignore assigned promply
            playerDetails: undefined,
        };

        const fullProfile =
            SPTEndLocalRaid.helpers.profileHelper.getFullProfile(sessionId)!;
        const playerStatusDetails = new PlayerStatusDetails(endRaidPackage);

        // playerDetails no longer undefined
        endRaidPackage = { ...endRaidPackage, playerDetails: playerStatusDetails };

        SPTEndLocalRaid.helpers.botLootCacheService.clearCache();

        // Reset flea interval time to out-of-raid value
        SPTEndLocalRaid.helpers.ragfairConfig.runIntervalSeconds =
            SPTEndLocalRaid.helpers.ragfairConfig.runIntervalValues.outOfRaid;
        SPTEndLocalRaid.helpers.hideoutConfig.runIntervalSeconds =
            SPTEndLocalRaid.helpers.hideoutConfig.runIntervalValues.outOfRaid;

        ItemTransferHelper.checkBTRTransfer(endRaidPackage);

        if (playerStatusDetails.isTransfer && request.locationTransit) {
            // Manually store the map player just left
            request.locationTransit.sptLastVisitedLocation =
                playerStatusDetails.locationName;
            // TODO - Persist each players last visited location history over multiple transits, e.g using InMemoryCacheService, need to take care to not let data get stored forever
            // Store transfer data for later use in `startLocalRaid()` when next raid starts
            request.locationTransit.sptExitName = request.results.exitName;
            SPTEndLocalRaid.helpers.applicationContext.addValue(
                ContextVariableType.TRANSIT_INFO,
                request.locationTransit
            );
        }

        if (!playerStatusDetails.isPMC) {
            this.handlePostRaidPlayerScav(
                endRaidPackage,
                fullProfile.characters.pmc,
                fullProfile.characters.scav,
                playerStatusDetails.isDead,
                playerStatusDetails.isTransfer,
                request
            );

            return;
        }

        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\

        this.postRaidPlayerUSEC(
            sessionId,
            fullProfile,
            fullProfile?.characters.scav,
            playerStatusDetails.isDead,
            playerStatusDetails.isSurvived,
            playerStatusDetails.isTransfer,
            request,
            playerStatusDetails.locationName
        );

        //            \\
        //            \\
        //            \\
        //            \\
        //            \\

        // Handle car extracts
        if (
            request.results.exitName != null &&
            request.results.exitName.toLowerCase().includes("v-ex")
        ) {
            this.handleCarExtract(
                request.results.exitName,
                fullProfile.characters.pmc,
                sessionId
            );
        }

        // Handle coop exit
        if (
            request.results.exitName != null &&
            SPTEndLocalRaid.helpers.inRaidConfig.coopExtracts.includes(
                request.results.exitName
            ) &&
            SPTEndLocalRaid.helpers.traderConfig.fence.coopExtractGift.sendGift
        ) {
            this.handleCoopExtract(
                sessionId,
                fullProfile.characters.pmc,
                request.results.exitName
            );
            this.sendCoopTakenFenceMessage(sessionId);
        }

        SPTEndLocalRaid.helpers.logger.success("RAID HAS ENDED!");
    };
}
