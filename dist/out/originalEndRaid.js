"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playerStatusDetails_1 = __importDefault(require("./playerStatusDetails"));
const itemTransferHelper_1 = __importDefault(require("./itemTransferHelper"));
var Traders;
(function (Traders) {
    Traders["PRAPOR"] = "54cb50c76803fa8b248b4571";
    Traders["THERAPIST"] = "54cb57776803fa99248b456e";
    Traders["FENCE"] = "579dc571d53a0658a154fbec";
    Traders["SKIER"] = "58330581ace78e27b8b10cee";
    Traders["PEACEKEEPER"] = "5935c25fb3acc3127c3d8cd9";
    Traders["MECHANIC"] = "5a7c2eca46aef81a7ca2145d";
    Traders["RAGMAN"] = "5ac3b934156ae10c4430e83c";
    Traders["JAEGER"] = "5c0647fdd443bc2504c2d371";
    Traders["LIGHTHOUSEKEEPER"] = "638f541a29ffd1183d187f57";
    Traders["BTR"] = "656f0f98d80a697f855d34b1";
    Traders["REF"] = "6617beeaa9cfa777ca915b7c";
})(Traders || (Traders = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["USER_MESSAGE"] = 1] = "USER_MESSAGE";
    MessageType[MessageType["NPC_TRADER"] = 2] = "NPC_TRADER";
    MessageType[MessageType["AUCTION_MESSAGE"] = 3] = "AUCTION_MESSAGE";
    MessageType[MessageType["FLEAMARKET_MESSAGE"] = 4] = "FLEAMARKET_MESSAGE";
    MessageType[MessageType["ADMIN_MESSAGE"] = 5] = "ADMIN_MESSAGE";
    MessageType[MessageType["GROUP_CHAT_MESSAGE"] = 6] = "GROUP_CHAT_MESSAGE";
    MessageType[MessageType["SYSTEM_MESSAGE"] = 7] = "SYSTEM_MESSAGE";
    MessageType[MessageType["INSURANCE_RETURN"] = 8] = "INSURANCE_RETURN";
    MessageType[MessageType["GLOBAL_CHAT"] = 9] = "GLOBAL_CHAT";
    MessageType[MessageType["QUEST_START"] = 10] = "QUEST_START";
    MessageType[MessageType["QUEST_FAIL"] = 11] = "QUEST_FAIL";
    MessageType[MessageType["QUEST_SUCCESS"] = 12] = "QUEST_SUCCESS";
    MessageType[MessageType["MESSAGE_WITH_ITEMS"] = 13] = "MESSAGE_WITH_ITEMS";
    MessageType[MessageType["INITIAL_SUPPORT"] = 14] = "INITIAL_SUPPORT";
    MessageType[MessageType["BTR_ITEMS_DELIVERY"] = 15] = "BTR_ITEMS_DELIVERY";
})(MessageType || (MessageType = {}));
var CustomisationSource;
(function (CustomisationSource) {
    CustomisationSource["QUEST"] = "quest";
    CustomisationSource["PRESTIGE"] = "prestige";
    CustomisationSource["ACHIEVEMENT"] = "achievement";
    CustomisationSource["UNLOCKED_IN_GAME"] = "unlockedInGame";
    CustomisationSource["PAID"] = "paid";
    CustomisationSource["DROP"] = "drop";
    CustomisationSource["DEFAULT"] = "default";
})(CustomisationSource || (CustomisationSource = {}));
var ContextVariableType;
(function (ContextVariableType) {
    /** Logged in users session id */
    ContextVariableType[ContextVariableType["SESSION_ID"] = 0] = "SESSION_ID";
    /** Currently acive raid information */
    ContextVariableType[ContextVariableType["RAID_CONFIGURATION"] = 1] = "RAID_CONFIGURATION";
    /** SessionID + Timestamp when client first connected, has _ between values */
    ContextVariableType[ContextVariableType["CLIENT_START_TIMESTAMP"] = 2] = "CLIENT_START_TIMESTAMP";
    /** When player is loading into map and loot is requested */
    ContextVariableType[ContextVariableType["REGISTER_PLAYER_REQUEST"] = 3] = "REGISTER_PLAYER_REQUEST";
    ContextVariableType[ContextVariableType["RAID_ADJUSTMENTS"] = 4] = "RAID_ADJUSTMENTS";
    /** Data returned from client request object from endLocalRaid() */
    ContextVariableType[ContextVariableType["TRANSIT_INFO"] = 5] = "TRANSIT_INFO";
})(ContextVariableType || (ContextVariableType = {}));
var QuestStatus;
(function (QuestStatus) {
    QuestStatus[QuestStatus["Locked"] = 0] = "Locked";
    QuestStatus[QuestStatus["AvailableForStart"] = 1] = "AvailableForStart";
    QuestStatus[QuestStatus["Started"] = 2] = "Started";
    QuestStatus[QuestStatus["AvailableForFinish"] = 3] = "AvailableForFinish";
    QuestStatus[QuestStatus["Success"] = 4] = "Success";
    QuestStatus[QuestStatus["Fail"] = 5] = "Fail";
    QuestStatus[QuestStatus["FailRestartable"] = 6] = "FailRestartable";
    QuestStatus[QuestStatus["MarkedAsFailed"] = 7] = "MarkedAsFailed";
    QuestStatus[QuestStatus["Expired"] = 8] = "Expired";
    QuestStatus[QuestStatus["AvailableAfter"] = 9] = "AvailableAfter";
})(QuestStatus || (QuestStatus = {}));
class Source {
    static helpers;
    static setPlayerInventoryOnDeath;
    static getRandomisedArmorRepairDegradationValue(armorMaterial, isRepairKit, armorMax, traderQualityMultipler) {
        // Degradation value is based on the armor material
        const armorMaterialSettings = Source.helpers.databaseService.getGlobals().config.ArmorMaterials[armorMaterial];
        const minMultiplier = isRepairKit
            ? armorMaterialSettings.MinRepairKitDegradation
            : armorMaterialSettings.MinRepairDegradation;
        const maxMultiplier = isRepairKit
            ? armorMaterialSettings.MaxRepairKitDegradation
            : armorMaterialSettings.MaxRepairDegradation;
        const duraLossPercent = Source.helpers.randomUtil.getFloat(minMultiplier, maxMultiplier);
        const duraLossMultipliedByTraderMultiplier = duraLossPercent * armorMax * traderQualityMultipler;
        return Number(duraLossMultipliedByTraderMultiplier.toFixed(2));
    }
    static getRandomisedWeaponRepairDegradationValue(itemProps, isRepairKit, weaponMax, traderQualityMultipler) {
        const minRepairDeg = isRepairKit
            ? itemProps.MinRepairKitDegradation
            : itemProps.MinRepairDegradation;
        let maxRepairDeg = isRepairKit
            ? itemProps.MaxRepairKitDegradation
            : itemProps.MaxRepairDegradation;
        // WORKAROUND: Some items are always 0 when repairkit is true
        if (maxRepairDeg === 0) {
            maxRepairDeg = itemProps.MaxRepairDegradation;
        }
        const duraLossPercent = Source.helpers.randomUtil.getFloat(minRepairDeg, maxRepairDeg);
        const duraLossMultipliedByTraderMultiplier = duraLossPercent * weaponMax * traderQualityMultipler;
        return Number(duraLossMultipliedByTraderMultiplier.toFixed(2));
    }
    applyTraderStandingAdjustments(tradersServerProfile, tradersClientProfile) {
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
    }
    migrateScavQuestProgressToPmcProfile(scavProfile, pmcProfile) {
        for (const scavQuest of scavProfile.Quests) {
            const pmcQuest = pmcProfile.Quests.find((quest) => quest.qid === scavQuest.qid);
            if (!pmcQuest) {
                Source.helpers.logger.warning(Source.helpers.localisationService.getText("inraid-unable_to_migrate_pmc_quest_not_found_in_profile", scavQuest.qid));
                continue;
            }
            // Get counters related to scav quest
            const matchingCounters = Object.values(scavProfile.TaskConditionCounters).filter((counter) => counter.sourceId === scavQuest.qid);
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
    }
    mergePmcAndScavEncyclopedias(primary, secondary) {
        function extend(target, source) {
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
    }
    handlePostRaidPlayerScav(sessionDetails, pmcProfile, scavProfile, isDead, isTransfer, request) {
        const postRaidProfile = request.results.profile;
        if (isTransfer) {
            // We want scav inventory to persist into next raid when pscav is moving between maps
            Source.helpers.inRaidHelper.setInventory(sessionDetails.sessionId, scavProfile, postRaidProfile, true, isTransfer);
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
        scavProfile.Stats.Eft.TotalSessionExperience = 0;
        this.applyTraderStandingAdjustments(scavProfile.TradersInfo, request.results.profile.TradersInfo);
        // Clamp fence standing within -7 to 15 range
        const fenceMax = Source.helpers.traderConfig.fence.playerRepMax; // 15
        const fenceMin = Source.helpers.traderConfig.fence.playerRepMin; //-7
        const currentFenceStanding = request.results.profile.TradersInfo[Traders.FENCE].standing;
        scavProfile.TradersInfo[Traders.FENCE].standing = Math.min(Math.max(currentFenceStanding, fenceMin), fenceMax);
        // Successful extract as scav, give some rep
        if (sessionDetails.playerDetails.isSurvived &&
            scavProfile.TradersInfo[Traders.FENCE].standing < fenceMax) {
            scavProfile.TradersInfo[Traders.FENCE].standing +=
                Source.helpers.inRaidConfig.scavExtractStandingGain;
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
            Source.helpers.playerScavGenerator.generate(sessionDetails.sessionId);
        }
        // Update last played property
        pmcProfile.Info.LastTimePlayedAsSavage = Source.helpers.timeUtil.getTimestamp();
        // Force a profile save
        Source.helpers.saveServer.saveProfile(sessionDetails.sessionId);
    }
    processAchievementRewards(fullProfile, postRaidAchievements) {
        const sessionId = fullProfile.info.id;
        const pmcProfile = fullProfile.characters.pmc;
        const preRaidAchievementIds = Object.keys(fullProfile.characters.pmc.Achievements);
        const postRaidAchievementIds = Object.keys(postRaidAchievements);
        const achievementIdsAcquiredThisRaid = postRaidAchievementIds.filter((id) => !preRaidAchievementIds.includes(id));
        // Get achievement data from db
        const achievementsDb = Source.helpers.databaseService.getTemplates().achievements;
        // Map the achievement ids player obtained in raid with matching achievement data from db
        const achievements = achievementIdsAcquiredThisRaid.map((achievementId) => achievementsDb.find((achievementDb) => achievementDb.id === achievementId));
        if (!achievements) {
            // No achievements found
            return;
        }
        for (const achievement of achievements) {
            const rewardItems = Source.helpers.rewardHelper.applyRewards(achievement.rewards, CustomisationSource.ACHIEVEMENT, fullProfile, pmcProfile, achievement.id);
            if (rewardItems?.length > 0) {
                Source.helpers.mailSendService.sendLocalisedSystemMessageToPlayer(sessionId, "670547bb5fa0b1a7c30d5836 0", rewardItems, [], Source.helpers.timeUtil.getHoursAsSeconds(24 * 7));
            }
        }
    }
    processPostRaidQuests(questsToProcess) {
        for (const quest of questsToProcess) {
            quest.status = Number(QuestStatus[quest.status]);
            // Iterate over each status timer key and convert from a string into the enums number value
            for (const statusTimerKey in quest.statusTimers) {
                if (Number.isNaN(Number.parseInt(statusTimerKey))) {
                    // Is a string, convert
                    quest.statusTimers[QuestStatus[statusTimerKey]] =
                        quest.statusTimers[statusTimerKey];
                    // Delete the old string key/value
                    quest.statusTimers[statusTimerKey] = undefined;
                }
            }
        }
        // Find marked as failed quests + flagged as restartable and re-status them as 'failed' so they can be restarted by player
        const failedQuests = questsToProcess.filter((quest) => quest.status === QuestStatus.MarkedAsFailed);
        for (const failedQuest of failedQuests) {
            const dbQuest = Source.helpers.databaseService.getQuests()[failedQuest.qid];
            if (!dbQuest) {
                continue;
            }
            if (dbQuest.restartable) {
                failedQuest.status = QuestStatus.Fail;
            }
        }
        return questsToProcess;
    }
    lightkeeperQuestWorkaround(sessionId, postRaidQuests, preRaidQuests, pmcProfile) {
        // LK quests that were not completed before raid but now are
        const newlyCompletedLightkeeperQuests = postRaidQuests.filter((postRaidQuest) => postRaidQuest.status === QuestStatus.Success &&
            preRaidQuests.find((preRaidQuest) => preRaidQuest.qid === postRaidQuest.qid &&
                preRaidQuest.status !== QuestStatus.Success) &&
            Source.helpers.databaseService.getQuests()[postRaidQuest.qid]?.traderId ===
                Traders.LIGHTHOUSEKEEPER);
        // Run server complete quest process to ensure player gets rewards
        for (const questToComplete of newlyCompletedLightkeeperQuests) {
            Source.helpers.questHelper.completeQuest(pmcProfile, {
                Action: "CompleteQuest",
                qid: questToComplete.qid,
                removeExcessItems: false,
            }, sessionId);
        }
    }
    handleInsuredItemLostEvent(sessionId, preRaidPmcProfile, request, locationName) {
        if (request.lostInsuredItems?.length > 0) {
            const mappedItems = Source.helpers.insuranceService.mapInsuredItemsToTrader(sessionId, request.lostInsuredItems, preRaidPmcProfile);
            // Is possible to have items in lostInsuredItems but removed before reaching mappedItems
            if (mappedItems.length === 0) {
                return;
            }
            Source.helpers.insuranceService.storeGearLostInRaidToSendLater(sessionId, mappedItems);
            Source.helpers.insuranceService.startPostRaidInsuranceLostProcess(preRaidPmcProfile, sessionId, locationName);
        }
    }
    checkForAndFixPickupQuestsAfterDeath(sessionId, lostQuestItems, profileQuests) {
        // Exclude completed quests
        const activeQuestIdsInProfile = profileQuests
            .filter((quest) => ![QuestStatus.Success, QuestStatus.AvailableForStart].includes(quest.status))
            .map((status) => status.qid);
        // Get db details of quests we found above
        const questDb = Object.values(Source.helpers.databaseService.getQuests()).filter((quest) => activeQuestIdsInProfile.includes(quest._id));
        for (const lostItem of lostQuestItems) {
            let matchingConditionId;
            // Find a quest that has a FindItem condition that has the list items tpl as a target
            const matchingQuests = questDb.filter((quest) => {
                const matchingCondition = quest.conditions.AvailableForFinish.find((questCondition) => questCondition.conditionType === "FindItem" &&
                    questCondition.target.includes(lostItem._tpl));
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
                Source.helpers.logger.error(`Unable to fix quest item: ${lostItem}, ${matchingQuests.length} matching quests found, expected 1`);
                continue;
            }
            const matchingQuest = matchingQuests[0];
            // We have a match, remove the condition id from profile to reset progress and let player pick item up again
            const profileQuestToUpdate = profileQuests.find((questStatus) => questStatus.qid === matchingQuest._id);
            if (!profileQuestToUpdate) {
                // Profile doesnt have a matching quest
                continue;
            }
            // Filter out the matching condition we found
            profileQuestToUpdate.completedConditions =
                profileQuestToUpdate.completedConditions.filter((conditionId) => conditionId !== matchingConditionId);
        }
    }
    getFenceStandingAfterExtract(pmcData, baseGain, extractCount) {
        // Get current standing
        const fenceId = Traders.FENCE;
        let fenceStanding = Number(pmcData.TradersInfo[fenceId].standing);
        // get standing after taking extract x times, x.xx format, gain from extract can be no smaller than 0.01
        fenceStanding += Math.max(baseGain / extractCount, 0.01);
        // Ensure fence loyalty level is not above/below the range -7 to 15
        const newFenceStanding = Math.min(Math.max(fenceStanding, -7), 15);
        Source.helpers.logger.debug(`Old vs new fence standing: ${pmcData.TradersInfo[fenceId].standing}, ${newFenceStanding}`);
        return Number(newFenceStanding.toFixed(2));
    }
    handleCarExtract(extractName, pmcData, sessionId) {
        // Ensure key exists for extract
        if (!(extractName in pmcData.CarExtractCounts)) {
            pmcData.CarExtractCounts[extractName] = 0;
        }
        // Increment extract count value
        pmcData.CarExtractCounts[extractName] += 1;
        // Not exact replica of Live behaviour
        // Simplified for now, no real reason to do the whole (unconfirmed) extra 0.01 standing per day regeneration mechanic
        const newFenceStanding = this.getFenceStandingAfterExtract(pmcData, Source.helpers.inRaidConfig.carExtractBaseStandingGain, pmcData.CarExtractCounts[extractName]);
        const fenceId = Traders.FENCE;
        pmcData.TradersInfo[fenceId].standing = newFenceStanding;
        // Check if new standing has leveled up trader
        Source.helpers.traderHelper.lvlUp(fenceId, pmcData);
        pmcData.TradersInfo[fenceId].loyaltyLevel = Math.max(pmcData.TradersInfo[fenceId].loyaltyLevel, 1);
        Source.helpers.logger.debug(`Car extract: ${extractName} used, total times taken: ${pmcData.CarExtractCounts[extractName]}`);
        // Copy updated fence rep values into scav profile to ensure consistency
        const scavData = Source.helpers.profileHelper.getScavProfile(sessionId);
        scavData.TradersInfo[fenceId].standing = pmcData.TradersInfo[fenceId].standing;
        scavData.TradersInfo[fenceId].loyaltyLevel =
            pmcData.TradersInfo[fenceId].loyaltyLevel;
    }
    handleCoopExtract(sessionId, pmcData, extractName) {
        pmcData.CoopExtractCounts ||= {};
        // Ensure key exists for extract
        if (!(extractName in pmcData.CoopExtractCounts)) {
            pmcData.CoopExtractCounts[extractName] = 0;
        }
        // Increment extract count value
        pmcData.CoopExtractCounts[extractName] += 1;
        // Get new fence standing value
        const newFenceStanding = this.getFenceStandingAfterExtract(pmcData, Source.helpers.inRaidConfig.coopExtractBaseStandingGain, pmcData.CoopExtractCounts[extractName]);
        const fenceId = Traders.FENCE;
        pmcData.TradersInfo[fenceId].standing = newFenceStanding;
        // Check if new standing has leveled up trader
        Source.helpers.traderHelper.lvlUp(fenceId, pmcData);
        pmcData.TradersInfo[fenceId].loyaltyLevel = Math.max(pmcData.TradersInfo[fenceId].loyaltyLevel, 1);
        // Copy updated fence rep values into scav profile to ensure consistency
        const scavData = Source.helpers.profileHelper.getScavProfile(sessionId);
        scavData.TradersInfo[fenceId].standing = pmcData.TradersInfo[fenceId].standing;
        scavData.TradersInfo[fenceId].loyaltyLevel =
            pmcData.TradersInfo[fenceId].loyaltyLevel;
    }
    sendCoopTakenFenceMessage(sessionId) {
        // Generate reward for taking coop extract
        const loot = Source.helpers.lootGenerator.createRandomLoot(Source.helpers.traderConfig.fence.coopExtractGift);
        const mailableLoot = [];
        const parentId = Source.helpers.hashUtil.generate();
        for (const item of loot) {
            item.parentId = parentId;
            mailableLoot.push(item);
        }
        // Send message from fence giving player reward generated above
        Source.helpers.mailSendService.sendLocalisedNpcMessageToPlayer(sessionId, Source.helpers.traderHelper.getTraderById(Traders.FENCE), MessageType.MESSAGE_WITH_ITEMS, Source.helpers.randomUtil.getArrayValue(Source.helpers.traderConfig.fence.coopExtractGift.messageLocaleIds), mailableLoot, Source.helpers.timeUtil.getHoursAsSeconds(Source.helpers.traderConfig.fence.coopExtractGift.giftExpiryHours));
    }
    endLocalRaid(sessionId, request) {
        Source.validateMembers(this);
        Source.helpers.logger.log("Raid Has ended...", "yellow");
        let endRaidPackage = {
            sessionId: sessionId,
            request: request,
            playerDetails: undefined,
        };
        const fullProfile = Source.helpers.profileHelper.getFullProfile(sessionId);
        const playerStatusDetails = new playerStatusDetails_1.default(endRaidPackage);
        endRaidPackage = { ...endRaidPackage, playerDetails: playerStatusDetails };
        Source.helpers.botLootCacheService.clearCache();
        Source.helpers.logger.log("Bot Cache Cleared...", "yellow");
        // Reset flea interval time to out-of-raid value
        Source.helpers.ragfairConfig.runIntervalSeconds =
            Source.helpers.ragfairConfig.runIntervalValues.outOfRaid;
        Source.helpers.hideoutConfig.runIntervalSeconds =
            Source.helpers.hideoutConfig.runIntervalValues.outOfRaid;
        itemTransferHelper_1.default.checkBTRTransfer(endRaidPackage);
        if (playerStatusDetails.isTransfer && request.locationTransit) {
            // Manually store the map player just left
            request.locationTransit.sptLastVisitedLocation =
                playerStatusDetails.locationName;
            // TODO - Persist each players last visited location history over multiple transits, e.g using InMemoryCacheService, need to take care to not let data get stored forever
            // Store transfer data for later use in `startLocalRaid()` when next raid starts
            request.locationTransit.sptExitName = request.results.exitName;
            Source.helpers.applicationContext.addValue(ContextVariableType.TRANSIT_INFO, request.locationTransit);
        }
        else {
            Source.helpers.logger.log("Player did not transit...", "yellow");
        }
        Source.helpers.logger.log(`Player was Scav: ${!playerStatusDetails.isPMC}`, "yellow");
        if (!playerStatusDetails.isPMC) {
            this.handlePostRaidPlayerScav(endRaidPackage, fullProfile.characters.pmc, fullProfile.characters.scav, playerStatusDetails.isDead, playerStatusDetails.isTransfer, request);
            return;
        }
        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\
        this.postRaidPlayerUSEC(sessionId, fullProfile, fullProfile?.characters.scav, playerStatusDetails.isDead, playerStatusDetails.isSurvived, playerStatusDetails.isTransfer, request, playerStatusDetails.locationName);
        //            \\
        //            \\
        //            \\
        //            \\
        //            \\
        // Handle car extracts
        if (request.results.exitName != null &&
            request.results.exitName.toLowerCase().includes("v-ex")) {
            this.handleCarExtract(request.results.exitName, fullProfile.characters.pmc, sessionId);
        }
        // Handle coop exit
        if (request.results.exitName != null &&
            Source.helpers.inRaidConfig.coopExtracts.includes(request.results.exitName) &&
            Source.helpers.traderConfig.fence.coopExtractGift.sendGift) {
            this.handleCoopExtract(sessionId, fullProfile.characters.pmc, request.results.exitName);
            this.sendCoopTakenFenceMessage(sessionId);
        }
        Source.helpers.logger.success("RAID HAS ENDED!");
    }
    setInventory(sessionID, serverProfile, postRaidProfile, isSurvived, isTransfer) {
        // Store insurance (as removeItem() removes insured items)
        const insured = Source.helpers.cloner.clone(serverProfile.InsuredItems);
        // Remove equipment and loot items stored on player from server profile in preparation for data from client being added
        Source.helpers.sptInventoryHelper.removeItem(serverProfile, serverProfile.Inventory.equipment, sessionID);
        // Remove quest items stored on player from server profile in preparation for data from client being added
        Source.helpers.sptInventoryHelper.removeItem(serverProfile, serverProfile.Inventory.questRaidItems, sessionID);
        // Get all items that have a parent of `serverProfile.Inventory.equipment` (All items player had on them at end of raid)
        const postRaidInventoryItems = Source.helpers.itemHelper.findAndReturnChildrenAsItems(postRaidProfile.Inventory.items, postRaidProfile.Inventory.equipment);
        // Get all items that have a parent of `serverProfile.Inventory.questRaidItems` (Quest items player had on them at end of raid)
        const postRaidQuestItems = Source.helpers.itemHelper.findAndReturnChildrenAsItems(postRaidProfile.Inventory.items, postRaidProfile.Inventory.questRaidItems);
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
        //     !Source.helpers.inRaidConfig.alwaysKeepFoundInRaidOnRaidEnd
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
    }
    addItemsToInventory(itemsToAdd, serverInventoryItems) {
        for (const itemToAdd of itemsToAdd) {
            // Try to find index of item to determine if we should add or replace
            const existingItemIndex = serverInventoryItems.findIndex((inventoryItem) => inventoryItem._id === itemToAdd._id);
            if (existingItemIndex === -1) {
                // Not found, add
                serverInventoryItems.push(itemToAdd);
            }
            else {
                // Replace item with one from client
                serverInventoryItems.splice(existingItemIndex, 1, itemToAdd);
            }
        }
    }
    sptSetInventory(sessionID, serverProfile, postRaidProfile, isSurvived, isTransfer) {
        // Store insurance (as removeItem() removes insured items)
        const insured = Source.helpers.cloner.clone(serverProfile.InsuredItems);
        // Remove equipment and loot items stored on player from server profile in preparation for data from client being added
        Source.helpers.sptInventoryHelper.removeItem(serverProfile, serverProfile.Inventory.equipment, sessionID);
        // Remove quest items stored on player from server profile in preparation for data from client being added
        Source.helpers.sptInventoryHelper.removeItem(serverProfile, serverProfile.Inventory.questRaidItems, sessionID);
        // Get all items that have a parent of `serverProfile.Inventory.equipment` (All items player had on them at end of raid)
        const postRaidInventoryItems = Source.helpers.itemHelper.findAndReturnChildrenAsItems(postRaidProfile.Inventory.items, postRaidProfile.Inventory.equipment);
        // Get all items that have a parent of `serverProfile.Inventory.questRaidItems` (Quest items player had on them at end of raid)
        const postRaidQuestItems = Source.helpers.itemHelper.findAndReturnChildrenAsItems(postRaidProfile.Inventory.items, postRaidProfile.Inventory.questRaidItems);
        //            \\
        //            \\
        //            \\
        // Mod Source \\
        //            \\
        //            \\
        //            \\
        // // Handle Removing of FIR status if player did not survive + not transferring
        // // Do after above filtering code to reduce work done
        // if (
        //     !isSurvived &&
        //     !isTransfer &&
        //     !Source.helpers.inRaidConfig.alwaysKeepFoundInRaidOnRaidEnd
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
    }
    postRaidPlayerUSEC(sessionId, fullProfile, scavProfile, isDead, isSurvived, isTransfer, request, locationName) {
        Source.helpers.logger.log("What", "yellow");
        const pmcProfile = fullProfile.characters.pmc;
        const postRaidProfile = request.results.profile;
        const preRaidProfileQuestDataClone = Source.helpers.cloner.clone(pmcProfile.Quests);
        Source.helpers.logger.log("Handling Post Raid PMC", "yellow");
        // MUST occur BEFORE inventory actions (setInventory()) occur
        // Player died, get quest items they lost for use later
        const lostQuestItems = Source.helpers.profileHelper.getQuestItemsInProfile(postRaidProfile);
        // Update inventory
        this.sptSetInventory(sessionId, pmcProfile, postRaidProfile, isSurvived, isTransfer);
        Source.helpers.logger.log("Inventory Set", "yellow");
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
        this.lightkeeperQuestWorkaround(sessionId, postRaidProfile.Quests, preRaidProfileQuestDataClone, pmcProfile);
        pmcProfile.WishList = postRaidProfile.WishList;
        pmcProfile.Info.Experience = postRaidProfile.Info.Experience;
        this.applyTraderStandingAdjustments(pmcProfile.TradersInfo, postRaidProfile.TradersInfo);
        // Must occur AFTER experience is set and stats copied over
        pmcProfile.Stats.Eft.TotalSessionExperience = 0;
        const fenceId = Traders.FENCE;
        // Clamp fence standing
        const currentFenceStanding = postRaidProfile.TradersInfo[fenceId].standing;
        pmcProfile.TradersInfo[fenceId].standing = Math.min(Math.max(currentFenceStanding, -7), 15); // Ensure it stays between -7 and 15
        // Copy fence values to Scav
        scavProfile.TradersInfo[fenceId] = pmcProfile.TradersInfo[fenceId];
        // MUST occur AFTER encyclopedia updated
        this.mergePmcAndScavEncyclopedias(pmcProfile, scavProfile);
        // Remove skill fatigue values
        for (const skill of scavProfile.Skills.Common) {
            skill.PointsEarnedDuringSession = 0.0;
        }
        // Handle temp, hydration, limb hp/effects
        Source.helpers.healthHelper.updateProfileHealthPostRaid(pmcProfile, postRaidProfile.Health, sessionId, isDead);
        // This must occur _BEFORE_ `deleteInventory`, as that method clears insured items
        this.handleInsuredItemLostEvent(sessionId, pmcProfile, request, locationName);
        if (isDead) {
            Source.helpers.logger.log("Player is Dead", "red");
            if (lostQuestItems.length > 0) {
                // MUST occur AFTER quests have post raid quest data has been merged "processPostRaidQuests()"
                // Player is dead + had quest items, check and fix any broken find item quests
                this.checkForAndFixPickupQuestsAfterDeath(sessionId, lostQuestItems, pmcProfile.Quests);
            }
            Source.helpers.pmcChatResponseService.sendKillerResponse(sessionId, pmcProfile, postRaidProfile.Stats.Eft.Aggressor);
            //            \\
            //            \\
            //            \\
            // MOD SOURCE \\
            //            \\
            //            \\
            //            \\
            Source.helpers.logger.log("Mod Injection site reached", "yellow");
            if (Source.setPlayerInventoryOnDeath) {
                Source.setPlayerInventoryOnDeath(pmcProfile, sessionId);
                Source.helpers.logger.success("Raid Had been Patched!");
            }
            else {
                Source.helpers.logger.error("Source was null removing all yo items g");
                Source.helpers.logger.error("For some reason you've re-enabled the original system >:(");
                Source.helpers.inRaidHelper.deleteInventory(pmcProfile, sessionId);
                Source.helpers.inRaidHelper.removeFiRStatusFromItemsInContainer(sessionId, pmcProfile, "SecuredContainer");
            }
            //           \\
            //           \\
            //           \\
            //    END    \\
            //           \\
            //           \\
            //           \\
        }
        // Must occur AFTER killer messages have been sent
        Source.helpers.matchBotDetailsCacheService.clearCache();
        const victims = postRaidProfile.Stats.Eft.Victims.filter((victim) => ["pmcbear", "pmcusec"].includes(victim.Role.toLowerCase()) // TODO replace with enum
        );
        if (victims?.length > 0) {
            // Player killed PMCs, send some mail responses to them
            Source.helpers.pmcChatResponseService.sendVictimResponse(sessionId, victims, pmcProfile);
        }
    }
    static validateMembers(cls) {
        Source.helpers.logger.log(`setPlayerInventoryOnDeath Hook Status: ${Source.setPlayerInventoryOnDeath != null ? "Loaded" : "Undefined"}`, Source.setPlayerInventoryOnDeath == null ? "red" : "green");
        Source.helpers.logger.log(`Custom Post Raid PMC Status: ${cls.postRaidPlayerUSEC != null ? "Loaded" : "Undefined"}`, cls.postRaidPlayerUSEC == null ? "red" : "green");
        Source.helpers.logger.log(`End Local Raid Status: ${cls.endLocalRaid != null ? "Loaded" : "Undefined"}`, cls.endLocalRaid == null ? "red" : "green");
    }
}
exports.default = Source;
