"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = __importDefault(require("../helpers/helpers"));
const itemHelpers_1 = __importDefault(require("../helpers/itemHelpers"));
const enums_1 = require("../Definitions/enums");
const config = __importStar(require("../config.json"));
class SPTPlayerScavGenerator {
    static helpers;
    static self;
    playerScavConfig;
    constructor() {
        this.playerScavConfig = SPTPlayerScavGenerator.helpers.configServer.getConfig(enums_1.ConfigTypes.PLAYERSCAV);
    }
    static get() {
        if (SPTPlayerScavGenerator.self == null) {
            SPTPlayerScavGenerator.self = new SPTPlayerScavGenerator();
        }
        return SPTPlayerScavGenerator.self;
    }
    static generate = (sessionID) => {
        const gen = SPTPlayerScavGenerator.get();
        return gen.generate(sessionID);
    };
    generate(sessionID) {
        // get karma level from profile
        const profile = SPTPlayerScavGenerator.helpers.saveServer.getProfile(sessionID);
        const profileCharactersClone = SPTPlayerScavGenerator.helpers.cloner.clone(profile.characters);
        const pmcDataClone = profileCharactersClone.pmc;
        const existingScavDataClone = profileCharactersClone.scav;
        const scavKarmaLevel = this.getScavKarmaLevel(pmcDataClone);
        // use karma level to get correct karmaSettings
        const playerScavKarmaSettings = this.playerScavConfig.karmaLevel[scavKarmaLevel];
        if (!playerScavKarmaSettings) {
            SPTPlayerScavGenerator.helpers.logger.error(SPTPlayerScavGenerator.helpers.localisationService.getText("scav-missing_karma_settings", scavKarmaLevel));
        }
        SPTPlayerScavGenerator.helpers.logger.debug(`generated player scav loadout with karma level ${scavKarmaLevel}`);
        // Edit baseBotNode values
        const baseBotNode = this.constructBotBaseTemplate(playerScavKarmaSettings.botTypeForLoot);
        this.adjustBotTemplateWithKarmaSpecificSettings(playerScavKarmaSettings, baseBotNode);
        let scavData = SPTPlayerScavGenerator.helpers.botGenerator.generatePlayerScav(sessionID, playerScavKarmaSettings.botTypeForLoot.toLowerCase(), "easy", baseBotNode, pmcDataClone);
        // Remove cached bot data after scav was generated
        SPTPlayerScavGenerator.helpers.botLootCacheService.clearCache();
        // Add scav metadata
        scavData.savage = undefined;
        scavData.aid = pmcDataClone.aid;
        scavData.TradersInfo = pmcDataClone.TradersInfo;
        scavData.Info.Settings = {};
        scavData.Info.Bans = [];
        scavData.Info.RegistrationDate = pmcDataClone.Info.RegistrationDate;
        scavData.Info.GameVersion = pmcDataClone.Info.GameVersion;
        scavData.Info.MemberCategory = enums_1.MemberCategory.UNIQUE_ID;
        scavData.Info.lockedMoveCommands = true;
        scavData.RagfairInfo = pmcDataClone.RagfairInfo;
        scavData.UnlockedInfo = pmcDataClone.UnlockedInfo;
        // Persist previous scav data into new scav
        scavData._id = existingScavDataClone._id ?? pmcDataClone.savage;
        scavData.sessionId = existingScavDataClone.sessionId ?? pmcDataClone.sessionId;
        scavData.Skills = this.getScavSkills(existingScavDataClone);
        scavData.Stats = this.getScavStats(existingScavDataClone);
        scavData.Info.Level = this.getScavLevel(existingScavDataClone);
        scavData.Info.Experience = this.getScavExperience(existingScavDataClone);
        scavData.Quests = existingScavDataClone.Quests ?? [];
        scavData.TaskConditionCounters = existingScavDataClone.TaskConditionCounters ?? {};
        scavData.Notes = existingScavDataClone.Notes ?? { Notes: [] };
        scavData.WishList = existingScavDataClone.WishList ?? {};
        scavData.Encyclopedia = pmcDataClone.Encyclopedia ?? {};
        // Add additional items to player scav as loot
        this.addAdditionalLootToPlayerScavContainers(playerScavKarmaSettings.lootItemsToAddChancePercent, scavData, ["TacticalVest", "Pockets", "Backpack"]);
        // Remove secure container
        scavData =
            SPTPlayerScavGenerator.helpers.profileHelper.removeSecureContainer(scavData);
        //            \\
        //            \\
        //            \\
        // MOD SOURCE \\
        //            \\
        //            \\
        //            \\
        // Set cooldown timer
        scavData = this.setScavCooldownTimer(scavData, pmcDataClone);
        if (config.DoScavChanges) {
            const original = SPTPlayerScavGenerator.helpers.cloner.clone(scavData.Info.SavageLockTime);
            scavData.Info.SavageLockTime =
                original -
                    helpers_1.default.getRandomPercentage(original, config.ScavChanges.CooldownSubtractionPercentageModifer);
            SPTPlayerScavGenerator.helpers.logger.log("Player Scav timer changed!", "green");
            itemHelpers_1.default.dumpChangeInValue([
                [original, scavData.Info.SavageLockTime, "Time decrease: "],
            ]);
        }
        //            \\
        //            \\
        //            \\
        //            \\
        //            \\
        //            \\
        // Add scav to the profile
        SPTPlayerScavGenerator.helpers.saveServer.getProfile(sessionID).characters.scav =
            scavData;
        return scavData;
    }
    /**
     * Add items picked from `playerscav.lootItemsToAddChancePercent`
     * @param possibleItemsToAdd dict of tpl + % chance to be added
     * @param scavData
     * @param containersToAddTo Possible slotIds to add loot to
     */
    addAdditionalLootToPlayerScavContainers(possibleItemsToAdd, scavData, containersToAddTo) {
        for (const tpl in possibleItemsToAdd) {
            const shouldAdd = SPTPlayerScavGenerator.helpers.randomUtil.getChance100(possibleItemsToAdd[tpl]);
            if (!shouldAdd) {
                continue;
            }
            const itemResult = SPTPlayerScavGenerator.helpers.itemHelper.getItem(tpl);
            if (!itemResult[0]) {
                SPTPlayerScavGenerator.helpers.logger.warning(SPTPlayerScavGenerator.helpers.localisationService.getText("scav-unable_to_add_item_to_player_scav", tpl));
                continue;
            }
            const itemTemplate = itemResult[1];
            const itemsToAdd = [
                {
                    _id: SPTPlayerScavGenerator.helpers.hashUtil.generate(),
                    _tpl: itemTemplate._id,
                    ...SPTPlayerScavGenerator.helpers.botGeneratorHelper.generateExtraPropertiesForItem(itemTemplate),
                },
            ];
            const result = SPTPlayerScavGenerator.helpers.botGeneratorHelper.addItemWithChildrenToEquipmentSlot(containersToAddTo, itemsToAdd[0]._id, itemTemplate._id, itemsToAdd, scavData.Inventory);
            if (result !== enums_1.ItemAddedResult.SUCCESS) {
                SPTPlayerScavGenerator.helpers.logger.debug(`Unable to add keycard to bot. Reason: ${enums_1.ItemAddedResult[result]}`);
            }
        }
    }
    /**
     * Get the scav karama level for a profile
     * Is also the fence trader rep level
     * @param pmcData pmc profile
     * @returns karma level
     */
    getScavKarmaLevel(pmcData) {
        const fenceInfo = pmcData.TradersInfo[enums_1.Traders.FENCE];
        // Can be empty during profile creation
        if (!fenceInfo) {
            SPTPlayerScavGenerator.helpers.logger.warning(SPTPlayerScavGenerator.helpers.localisationService.getText("scav-missing_karma_level_getting_default"));
            return 0;
        }
        if (fenceInfo.standing > 6) {
            return 6;
        }
        // e.g. 2.09 becomes 2
        return Math.floor(fenceInfo.standing);
    }
    /**
     * Get a baseBot template
     * If the parameter doesnt match "assault", take parts from the loot type and apply to the return bot template
     * @param botTypeForLoot bot type to use for inventory/chances
     * @returns IBotType object
     */
    constructBotBaseTemplate(botTypeForLoot) {
        const baseScavType = "assault";
        const assaultBase = SPTPlayerScavGenerator.helpers.cloner.clone(SPTPlayerScavGenerator.helpers.botHelper.getBotTemplate(baseScavType));
        // Loot bot is same as base bot, return base with no modification
        if (botTypeForLoot === baseScavType) {
            return assaultBase;
        }
        const lootBase = SPTPlayerScavGenerator.helpers.cloner.clone(SPTPlayerScavGenerator.helpers.botHelper.getBotTemplate(botTypeForLoot));
        assaultBase.inventory = lootBase.inventory;
        assaultBase.chances = lootBase.chances;
        assaultBase.generation = lootBase.generation;
        return assaultBase;
    }
    /**
     * Adjust equipment/mod/item generation values based on scav karma levels
     * @param karmaSettings Values to modify the bot template with
     * @param baseBotNode bot template to modify according to karama level settings
     */
    adjustBotTemplateWithKarmaSpecificSettings(karmaSettings, baseBotNode) {
        // Adjust equipment chance values
        for (const equipmentKey in karmaSettings.modifiers.equipment) {
            if (karmaSettings.modifiers.equipment[equipmentKey] === 0) {
                continue;
            }
            // @ts-ignore Typed wrong on SPT end
            baseBotNode.chances.equipment[equipmentKey] +=
                karmaSettings.modifiers.equipment[equipmentKey];
        }
        // Adjust mod chance values
        for (const modKey in karmaSettings.modifiers.mod) {
            if (karmaSettings.modifiers.mod[modKey] === 0) {
                continue;
            }
            // @ts-ignore Typed wrong on SPT end
            baseBotNode.chances.weaponMods[modKey] += karmaSettings.modifiers.mod[modKey];
        }
        // Adjust item spawn quantity values
        for (const itemLimitkey in karmaSettings.itemLimits) {
            // @ts-ignore Typed wrong on SPT end
            baseBotNode.generation.items[itemLimitkey] =
                // @ts-ignore Typed wrong on SPT end
                karmaSettings.itemLimits[itemLimitkey];
        }
        // Blacklist equipment
        for (const equipmentKey in karmaSettings.equipmentBlacklist) {
            const blacklistedItemTpls = karmaSettings.equipmentBlacklist[equipmentKey];
            for (const itemToRemove of blacklistedItemTpls) {
                // @ts-ignore Typed wrong on SPT end
                delete baseBotNode.inventory.equipment[equipmentKey][itemToRemove];
            }
        }
    }
    getScavSkills(scavProfile) {
        if (scavProfile.Skills) {
            return scavProfile.Skills;
        }
        return this.getDefaultScavSkills();
    }
    getDefaultScavSkills() {
        return { Common: [], Mastering: [], Points: 0 };
    }
    getScavStats(scavProfile) {
        if (scavProfile.Stats) {
            return scavProfile.Stats;
        }
        return SPTPlayerScavGenerator.helpers.profileHelper.getDefaultCounters();
    }
    getScavLevel(scavProfile) {
        // Info can be undefined on initial account creation
        if (!scavProfile.Info?.Level) {
            return 1;
        }
        return scavProfile.Info.Level;
    }
    getScavExperience(scavProfile) {
        // Info can be undefined on initial account creation
        if (!scavProfile.Info?.Experience) {
            return 0;
        }
        return scavProfile.Info.Experience;
    }
    /**
     * Set cooldown till pscav is playable
     * take into account scav cooldown bonus
     * @param scavData scav profile
     * @param pmcData pmc profile
     * @returns
     */
    setScavCooldownTimer(scavData, pmcData) {
        // Set cooldown time.
        // Make sure to apply ScavCooldownTimer bonus from Hideout if the player has it.
        let scavLockDuration = SPTPlayerScavGenerator.helpers.databaseService.getGlobals().config
            .SavagePlayCooldown;
        let modifier = 1;
        for (const bonus of pmcData.Bonuses) {
            if (bonus.type === enums_1.BonusType.SCAV_COOLDOWN_TIMER) {
                // Value is negative, so add.
                // Also note that for scav cooldown, multiple bonuses stack additively.
                modifier += bonus.value / 100;
            }
        }
        const fenceInfo = SPTPlayerScavGenerator.helpers.fenceService.getFenceInfo(pmcData);
        modifier *= fenceInfo.SavageCooldownModifier;
        scavLockDuration *= modifier;
        const fullProfile = SPTPlayerScavGenerator.helpers.profileHelper.getFullProfile(pmcData?.sessionId);
        if (fullProfile?.info?.edition?.toLowerCase?.().startsWith?.("spt developer")) {
            // Set scav cooldown timer to 10 seconds for spt developer account
            scavLockDuration = 10;
        }
        scavData.Info.SavageLockTime = Date.now() / 1000 + scavLockDuration;
        return scavData;
    }
}
exports.default = SPTPlayerScavGenerator;
