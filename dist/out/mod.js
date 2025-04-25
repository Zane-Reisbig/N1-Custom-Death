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
exports.mod = void 0;
const endLocalRaid_1 = require("./SPTSource/endLocalRaid");
const startLocalRaid_1 = require("./SPTSource/startLocalRaid");
const timers_1 = __importDefault(require("./helpers/timers"));
const helpers_1 = __importDefault(require("./helpers/helpers"));
const itemHelpers_1 = __importDefault(require("./helpers/itemHelpers"));
const inventoryHelpers_1 = __importStar(require("./helpers/inventoryHelpers"));
const itemTransferHelper_1 = __importDefault(require("./helpers/itemTransferHelper"));
const playerStatusDetails_1 = __importDefault(require("./Definitions/playerStatusDetails"));
const enums_1 = require("./Definitions/enums");
const config = __importStar(require("./config.json"));
class Mod {
    static container;
    static endLocalRaidInst;
    static startLocalRaidInst;
    static _helpers;
    static get helpers() {
        if (Mod._helpers == null) {
            Mod._helpers = helpers_1.default.get(Mod.container);
        }
        return Mod._helpers;
    }
    static preRaidInventory;
    static doDurabilityChange(playerInv) {
        // This sucks
        const allItems = Mod.helpers.databaseService.getItems();
        // Helmet Before
        if (playerInv.helmet) {
            for (const plate of playerInv.helmetArmorPlates) {
                plate.upd &&
                    plate.upd.Repairable &&
                    itemHelpers_1.default.changeDurabiltityByPercentage(plate, allItems[plate._tpl], config.OnDeathBehavior.DoRandomItemLossOnDeath
                        .DurabilityLossPercentages.Vest, { isArmor: true });
            }
        }
        else {
            Mod.helpers.logger.log("No Helmet to damage", "green");
        }
        // Helmet After
        // Vest Before
        if (playerInv.armorVest || playerInv.tacticalVest) {
            for (const plate of playerInv.armorVestPlates) {
                plate.upd &&
                    itemHelpers_1.default.changeDurabiltityByPercentage(plate, allItems[plate._tpl], config.OnDeathBehavior.DoRandomItemLossOnDeath
                        .DurabilityLossPercentages.Vest, { isArmor: true });
            }
        }
        else {
            Mod.helpers.logger.log("No Vest Or Rig Plates To damage", "green");
        }
        // Vest After
        // Primary Before
        if (playerInv.primary) {
            itemHelpers_1.default.changeDurabiltityByPercentage(playerInv.primary, allItems[playerInv.primary._tpl], config.OnDeathBehavior.DoRandomItemLossOnDeath.DurabilityLossPercentages
                .PrimaryWeapon);
        }
        else {
            Mod.helpers.logger.log("No Primay to damage", "green");
        }
        // Primary After
        // Secondary Before
        if (playerInv.secondary) {
            itemHelpers_1.default.changeDurabiltityByPercentage(playerInv.secondary, allItems[playerInv.secondary._tpl], config.OnDeathBehavior.DoRandomItemLossOnDeath.DurabilityLossPercentages
                .SecondaryWeapon);
        }
        else {
            Mod.helpers.logger.log("No Secondary to damage", "green");
        }
        // Secondary After
        // Holster Before
        if (playerInv.holster) {
            itemHelpers_1.default.changeDurabiltityByPercentage(playerInv.holster, allItems[playerInv.holster._tpl], config.OnDeathBehavior.DoRandomItemLossOnDeath.DurabilityLossPercentages
                .HolsterWeapon);
        }
        else {
            Mod.helpers.logger.log("No Holster Weapon to damage", "green");
        }
        // Holster After
    }
    static doFIRChange(playerInv) {
        // God damn this one is ugly too
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.PrimaryWeapon &&
            playerInv.primary) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.primary]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.SecondaryWeapon &&
            playerInv.secondary) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.secondary]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.HolsterWeapon &&
            playerInv.holster) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.holster]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Helmet &&
            playerInv.helmet) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.helmet]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Backpack &&
            playerInv.bag) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.bag]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.BackpackItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.bagItems);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Vest &&
            playerInv.tacticalVest) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.tacticalVest]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Vest &&
            playerInv.armorVest) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.armorVest]);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.VestItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.tacticalVestItems);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.PocketItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.pocketItems);
        }
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.SecureContainerItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.containerItems);
        }
    }
    static doRemoval(playerInv, playerData, sessionID) {
        const bagRemoval = inventoryHelpers_1.default.selectPercentageOfItemsFromInventory(playerInv.bagItems, config.OnDeathBehavior.DoRandomItemLossOnDeath.ItemLossPercentages.Bag);
        inventoryHelpers_1.default.dumpInventory(bagRemoval, "Bag Removal", "red");
        const pocketRemoval = inventoryHelpers_1.default.selectPercentageOfItemsFromInventory(playerInv.pocketItems, config.OnDeathBehavior.DoRandomItemLossOnDeath.ItemLossPercentages.Pocket);
        inventoryHelpers_1.default.dumpInventory(pocketRemoval, "Pocket Removal", "red");
        const vestRemoval = inventoryHelpers_1.default.selectPercentageOfItemsFromInventory(playerInv.bagItems, config.OnDeathBehavior.DoRandomItemLossOnDeath.ItemLossPercentages.Vest);
        inventoryHelpers_1.default.dumpInventory(vestRemoval, "Vest Removal", "red");
        for (const item of [...bagRemoval, ...pocketRemoval, ...vestRemoval]) {
            Mod.helpers.sptInventoryHelper.removeItem(playerData, item._id, sessionID);
        }
    }
    static scavChanges(playerData, sessionID) {
        if (!config.ScavChanges.Enabled)
            return;
        const newCooldown = new Date(Date.now() / 1000 +
            helpers_1.default.randInt(config.ScavChanges.InstantCooldownOnDeath
                ? { min: 0, max: 1 }
                : config.ScavChanges.MaxCooldownRangeInMinutes) *
                60);
        // @ts-expect-error This is valid, Dates can be parsed by 'Date.parse()' lmao
        playerData.Info.SavageLockTime = Date.parse(newCooldown);
    }
    static resetToPreRaidInventory(pmcData) {
        const currentPlayerInv = inventoryHelpers_1.default.clonePMCInv(pmcData);
        if (Mod.preRaidInventory == null) {
            throw new Error("Failed to get player inventory on raid start...");
        }
        const [postRaidContainer, postRaidContainerItems] = inventoryHelpers_1.default.extractItemAndContents(enums_1.EquipmentSlots.SECURED_CONTAINER, currentPlayerInv);
        if (postRaidContainer != null) {
            const containerItemIDs = postRaidContainerItems.reduce((init, cur) => [...init, cur._id], []);
            const deDupedItemList = [];
            for (const item of Mod.preRaidInventory) {
                // remove any item moved to your case in-raid from pre raid inventory
                // no dupes in this dojo
                if (containerItemIDs.includes(item._id))
                    continue;
                deDupedItemList.push(item);
            }
            const refreshedItems = Mod.helpers.itemHelper.replaceIDs([...deDupedItemList, ...postRaidContainerItems], pmcData);
            pmcData.Inventory.items = [];
            pmcData.Inventory.items = [...refreshedItems];
        }
        else {
            Mod.helpers.logger.log("How did you get a container in raid? Crazy.", "red");
        }
    }
    static doRandomItemLossOnDeath(pmcData, sessionID) {
        const playerInv = new inventoryHelpers_1.PMCInventory(pmcData, Mod.helpers);
        Mod.doFIRChange(playerInv);
        Mod.helpers.logger.log(`Removing Items: ${config.OnDeathBehavior.DoRandomItemLossOnDeath.Enabled}`, config.OnDeathBehavior.DoRandomItemLossOnDeath ? "red" : "green");
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath) {
            Mod.doRemoval(playerInv, pmcData, sessionID);
        }
        Mod.helpers.logger.log(`Durability Lost?: ${config.OnDeathBehavior.DoRandomItemLossOnDeath.DoDurabilityLoss}`, config.OnDeathBehavior.DoRandomItemLossOnDeath.DoDurabilityLoss
            ? "red"
            : "green");
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.DoDurabilityLoss) {
            Mod.doDurabilityChange(playerInv);
        }
    }
    static runInventoryActions(pmcData, sessionID) {
        Mod.helpers.logger.log("We are setting the inventory on death!", "green");
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.Enabled) {
            Mod.doRandomItemLossOnDeath(pmcData, sessionID);
            Mod.helpers.logger.log("Inventory has been picked thru!", "green");
        }
        else if (config.OnDeathBehavior.ResetToPreRaidInventory.Enabled) {
            Mod.resetToPreRaidInventory(pmcData);
            Mod.helpers.logger.log("Inventory reset!", "green");
        }
        else {
            Mod.helpers.logger.log("Inventory left untouched...", "green");
        }
    }
    preSptLoad(container) {
        Mod.container = container;
        Mod.endLocalRaidInst = new endLocalRaid_1.SPTEndLocalRaid();
        Mod.startLocalRaidInst = new startLocalRaid_1.SPTStartLocalRaid();
        endLocalRaid_1.SPTEndLocalRaid.onPMCDeath = Mod.runInventoryActions;
        endLocalRaid_1.SPTEndLocalRaid.onScavDeath = Mod.scavChanges;
        startLocalRaid_1.SPTStartLocalRaid.onRaidStart = (pmcData, sessionID, _res) => {
            Mod.helpers.logger.log(`SessionID: ${sessionID}`, "green");
            Mod.preRaidInventory = inventoryHelpers_1.default.clonePMCInv(pmcData);
            if (config.InsuranceChanges.Enabled) {
                const insuranceConfig = Mod.helpers.configServer.getConfig(enums_1.ConfigTypes.INSURANCE);
                if (config.InsuranceChanges.EnableReturnTimeOverride) {
                    insuranceConfig.returnTimeOverrideSeconds = Math.floor(helpers_1.default.randInt(config.InsuranceChanges.MaxReturnRangeInMinutes) *
                        60);
                    insuranceConfig.runIntervalSeconds =
                        insuranceConfig.returnTimeOverrideSeconds / 2;
                    Mod.helpers.logger.log(`Insurance Returns in: ${insuranceConfig.returnTimeOverrideSeconds / 60} minutes`, "green");
                    Mod.helpers.logger.log(`Next Insurance Run in: ${insuranceConfig.runIntervalSeconds / 60} minutes`, "green");
                }
            }
        };
        // Dear god do not forget to set helpers on other classes
        startLocalRaid_1.SPTStartLocalRaid.helpers = Mod.helpers;
        endLocalRaid_1.SPTEndLocalRaid.helpers = Mod.helpers;
        itemTransferHelper_1.default.helpers = Mod.helpers;
        playerStatusDetails_1.default.helpers = Mod.helpers;
        inventoryHelpers_1.default.helpers = Mod.helpers;
        itemHelpers_1.default.helpers = Mod.helpers;
        // srsly \\
        // Thankfully we can just update the config and SPT will do the rest
        if (config.InsuranceChanges.Enabled) {
            const insuranceConfig = Mod.helpers.configServer.getConfig(enums_1.ConfigTypes.INSURANCE);
            if (config.InsuranceChanges.InsuranceAlwaysWorks) {
                insuranceConfig.chanceNoAttachmentsTakenPercent = 100;
                for (const key in insuranceConfig.returnChancePercent) {
                    insuranceConfig.returnChancePercent[key] = 100;
                }
            }
            if (config.InsuranceChanges.KeepInMailBoxForever) {
                // Not technically infinite but I think 999 hours should be long enough
                insuranceConfig.storageTimeOverrideSeconds = 1000 * 60 * 60 * 999;
            }
        }
        // This is the hook from the tutorial!
        // Woo-Hooo!!
        container.afterResolution("LocationLifecycleService", 
        //@ts-expect-error This is correct actually
        (_t, result) => {
            result.endLocalRaid = Mod.endLocalRaidInst.endLocalRaid;
            result.startLocalRaid = Mod.startLocalRaidInst.startLocalRaid;
        }, { frequency: "Always" });
        // Let those doggies lay for ~20 minutes (default scav timer) if so chosen in the config
        if (!config.ScavChanges.Enabled || !config.ScavChanges.InstantCooldownOnLogin)
            return;
        // Otherwise wait for the session and reset that shit yo'
        timers_1.default.waitForNonFalsey(() => Mod.helpers.applicationContext.getLatestValue(enums_1.ContextVariableType.SESSION_ID), (val) => {
            const scav = Mod.helpers.profileHelper.getScavProfile(val.getValue());
            // set to 10 secs
            scav.Info.SavageLockTime = Date.now() / 1000 + 10;
            Mod.helpers.logger.log("Scav cooldown reset!", "green");
        });
    }
}
exports.mod = new Mod();
// TODO: This raid never happend, I.E. A "That's bullshit" command
