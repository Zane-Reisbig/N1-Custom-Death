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
const helpers_1 = __importDefault(require("./helpers"));
const originalEndRaid_1 = __importDefault(require("./originalEndRaid"));
const itemTransferHelper_1 = __importDefault(require("./itemTransferHelper"));
const playerStatusDetails_1 = __importDefault(require("./playerStatusDetails"));
const inventoryHelpers_1 = __importStar(require("./inventoryHelpers"));
const config = __importStar(require("./config.json"));
const itemHelpers_1 = __importDefault(require("./itemHelpers"));
class Mod {
    static container;
    static _helpers;
    static get helpers() {
        this._helpers = helpers_1.default.get(Mod.container);
        return Mod._helpers;
    }
    static doDurabilityChange(playerInv) {
        // This sucks
        // Helmet Before
        if (playerInv.helmet) {
            for (const plate of playerInv.helmetArmorPlates) {
                Mod.helpers.logger.log(`Helmet Plate Durability: ${plate.upd.Repairable?.Durability}\nMax Percent: ${plate.upd.Repairable?.MaxDurability}`, "yellow");
                plate.upd &&
                    plate.upd.Repairable &&
                    itemHelpers_1.default.changeDurabiltityByPercentage(plate, Mod.helpers.databaseService.getItems()[plate._tpl], config.DurabilityLossPercentages.Vest, { isArmor: true });
                Mod.helpers.logger.log(`Helmet Plate Durability: ${plate.upd.Repairable?.Durability}\nMax Percent: ${plate.upd.Repairable?.MaxDurability}`, "red");
            }
        }
        else {
            Mod.helpers.logger.log("No Helmet to damage", "green");
        }
        // Helmet After
        // Vest Before
        if (playerInv.armorVest || playerInv.tacticalVest) {
            for (const plate of playerInv.armorVestPlates) {
                Mod.helpers.logger.log(`Vest Plate Durability: ${plate.upd.Repairable?.Durability}\nMax Percent: ${plate.upd.Repairable?.MaxDurability}`, "yellow");
                plate.upd &&
                    itemHelpers_1.default.changeDurabiltityByPercentage(plate, Mod.helpers.databaseService.getItems()[plate._tpl], config.DurabilityLossPercentages.Vest, { isArmor: true });
                Mod.helpers.logger.log(`Vest Plate Durability: ${plate.upd.Repairable?.Durability}\nMax Percent: ${plate.upd.Repairable?.MaxDurability}`, "red");
            }
        }
        else {
            Mod.helpers.logger.log("No Vest Or Rig Plates To damage", "green");
        }
        // Vest After
        // Primary Before
        if (playerInv.primary) {
            Mod.helpers.logger.log(`First Primary Dura Percent: ${playerInv.primary.upd.Repairable?.Durability}\nMax Percent: ${playerInv.primary.upd.Repairable?.MaxDurability}`, "yellow");
            itemHelpers_1.default.changeDurabiltityByPercentage(playerInv.primary, Mod.helpers.databaseService.getItems()[playerInv.primary._tpl], config.DurabilityLossPercentages.PrimaryWeapon);
            Mod.helpers.logger.log(`First Primary Dura Percent: ${playerInv.primary.upd.Repairable?.Durability}\nMax Percent: ${playerInv.primary.upd.Repairable?.MaxDurability}`, "red");
        }
        else {
            Mod.helpers.logger.log("No Primay to damage", "green");
        }
        // Primary After
        // Secondary Before
        if (playerInv.secondary) {
            Mod.helpers.logger.log(`Second Primary Dura Percent: ${playerInv.secondary.upd.Repairable?.Durability}\nMax Percent: ${playerInv.secondary.upd.Repairable?.MaxDurability}`, "yellow");
            itemHelpers_1.default.changeDurabiltityByPercentage(playerInv.secondary, Mod.helpers.databaseService.getItems()[playerInv.secondary._tpl], config.DurabilityLossPercentages.SecondaryWeapon);
            Mod.helpers.logger.log(`Second Primary Dura Percent: ${playerInv.secondary.upd.Repairable?.Durability}\nMax Percent: ${playerInv.secondary.upd.Repairable?.MaxDurability}`, "red");
        }
        else {
            Mod.helpers.logger.log("No Secondary to damage", "green");
        }
        // Secondary After
        // Holster Before
        if (playerInv.holsterWeapon) {
            Mod.helpers.logger.log(`Holster Weapon Dura Percent: ${playerInv.holsterWeapon.upd.Repairable?.Durability}\nMax Percent: ${playerInv.holsterWeapon.upd.Repairable?.MaxDurability}`, "yellow");
            itemHelpers_1.default.changeDurabiltityByPercentage(playerInv.holsterWeapon, Mod.helpers.databaseService.getItems()[playerInv.holsterWeapon._tpl], config.DurabilityLossPercentages.HolsterWeapon);
            Mod.helpers.logger.log(`Holster Weapon Dura Percent: ${playerInv.holsterWeapon.upd.Repairable?.Durability}\nMax Percent: ${playerInv.holsterWeapon.upd.Repairable?.MaxDurability}`, "red");
        }
        else {
            Mod.helpers.logger.log("No Holster Weapon to damage", "green");
        }
        // Holster After
    }
    static doFIRChange(playerInv) {
        // God damn this one is ugly too
        if (config.RemoveFIR.PrimaryWeapon && playerInv.primary) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.primary]);
        }
        if (config.RemoveFIR.SecondaryWeapon && playerInv.secondary) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.secondary]);
        }
        if (config.RemoveFIR.HolsterWeapon && playerInv.holsterWeapon) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.holsterWeapon]);
        }
        if (config.RemoveFIR.Helmet && playerInv.helmet) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.helmet]);
        }
        if (config.RemoveFIR.Backpack && playerInv.bag) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.bag]);
        }
        if (config.RemoveFIR.BackpackItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.bagItems);
        }
        if (config.RemoveFIR.Vest && playerInv.tacticalVest) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.tacticalVest]);
        }
        if (config.RemoveFIR.Vest && playerInv.armorVest) {
            inventoryHelpers_1.default.removeFIRFromInventory([playerInv.armorVest]);
        }
        if (config.RemoveFIR.VestItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.tacticalVestItems);
        }
        if (config.RemoveFIR.PocketItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.pocketItems);
        }
        if (config.RemoveFIR.SecureContainerItems) {
            inventoryHelpers_1.default.removeFIRFromInventory(playerInv.containerItems);
        }
    }
    static doRemoval(playerInv, playerData, sessionID) {
        const bagRemoval = inventoryHelpers_1.default.selectPercentageOfItemsFromInventory(playerInv.bagItems, config.ItemLossPercentages.bag);
        inventoryHelpers_1.default.dumpInventory(bagRemoval, "Bag Removal", "red");
        const pocketRemoval = inventoryHelpers_1.default.selectPercentageOfItemsFromInventory(playerInv.pocketItems, config.ItemLossPercentages.pocket);
        inventoryHelpers_1.default.dumpInventory(pocketRemoval, "Pocket Removal", "red");
        const vestRemoval = inventoryHelpers_1.default.selectPercentageOfItemsFromInventory(playerInv.bagItems, config.ItemLossPercentages.vest);
        inventoryHelpers_1.default.dumpInventory(vestRemoval, "Vest Removal", "red");
        for (const item of [...bagRemoval, ...pocketRemoval, ...vestRemoval]) {
            Mod.helpers.sptInventoryHelper.removeItem(playerData, item._id, sessionID);
        }
    }
    static setInventory(playerData, sessionID) {
        Mod.helpers.logger.log("We are setting the inventory on death!", "green");
        const playerInv = new inventoryHelpers_1.PMCInventory(playerData, Mod.helpers);
        Mod.helpers.logger.log(`Running FIR Change - `, "red");
        Mod.doFIRChange(playerInv);
        Mod.helpers.logger.log(`Removing Items: ${config.DoRandomItemLossOnDeath}`, config.DoRandomItemLossOnDeath ? "red" : "green");
        if (config.DoRandomItemLossOnDeath) {
            Mod.doRemoval(playerInv, playerData, sessionID);
        }
        Mod.helpers.logger.log(`Durability Lost?: ${config.DoDurabilityLoss}`, config.DoDurabilityLoss ? "red" : "green");
        if (config.DoDurabilityLoss) {
            Mod.doDurabilityChange(playerInv);
        }
    }
    static endLocalRaid(sessionID, request) {
        const sourceInstance = new originalEndRaid_1.default();
        // Source.validateMembers(sourceInstance);
        sourceInstance.endLocalRaid(sessionID, request);
    }
    preSptLoad(container) {
        Mod.container = container;
        // Mod.readSetConfig();
        // Dear god do not forget to set helpers on other classes
        originalEndRaid_1.default.helpers = Mod.helpers;
        itemTransferHelper_1.default.helpers = Mod.helpers;
        playerStatusDetails_1.default.helpers = Mod.helpers;
        inventoryHelpers_1.default.helpers = Mod.helpers;
        itemHelpers_1.default.helpers = Mod.helpers;
        // srsly \\
        // This is the actual mod, the rest of this mess is the re-implementation
        //  of the LocationLifeCycleService, starting at the public method "endLocalRaid"
        //
        // This hooks in after the "postRaidPMC" function from the original spt/server
        originalEndRaid_1.default.setPlayerInventoryOnDeath = Mod.setInventory;
        // This is the hook from the tutorial!
        // Woo-Hooo!!
        container.afterResolution("LocationLifecycleService", 
        //@ts-expect-error This is correct actually
        (_t, result) => {
            result.endLocalRaid = Mod.endLocalRaid;
        }, { frequency: "Always" });
    }
}
exports.mod = new Mod();
