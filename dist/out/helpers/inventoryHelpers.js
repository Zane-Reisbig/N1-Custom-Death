"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PMCInventory = void 0;
const itemHelpers_1 = __importDefault(require("./itemHelpers"));
const enums_1 = require("../Definitions/enums");
class PMCInventory {
    everythingElse;
    helmet;
    helmetArmorPlates;
    bag;
    bagItems;
    tacticalVest;
    tacticalVestItems;
    armorVest;
    armorVestPlates;
    primary;
    secondary;
    holster;
    pockets;
    pocketItems;
    container;
    containerItems;
    constructor(pmcData, helpers) {
        this.bagItems = [];
        this.tacticalVestItems = [];
        this.pocketItems = [];
        this.containerItems = [];
        this.armorVestPlates = [];
        this.helmetArmorPlates = [];
        const allPlayerItems = helpers.itemHelper.findAndReturnChildrenAsItems(pmcData.Inventory.items, pmcData.Inventory.equipment);
        this.everythingElse = pmcData.Inventory.items.filter((i) => i.parentId !== pmcData.Inventory.equipment);
        for (const item of allPlayerItems) {
            if (item.slotId?.startsWith(enums_1.EquipmentSlots.HEADWEAR)) {
                this.helmet = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.BACKPACK)) {
                this.bag = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.TACTICAL_VEST)) {
                this.tacticalVest = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.ARMOR_VEST)) {
                this.armorVest = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.POCKETS)) {
                this.pockets = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.FIRST_PRIMARY_WEAPON)) {
                this.primary = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.SECOND_PRIMARY_WEAPON)) {
                this.secondary = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.HOLSTER)) {
                this.holster = item;
                continue;
            }
            else if (item.slotId?.startsWith(enums_1.EquipmentSlots.SECURED_CONTAINER)) {
                this.container = item;
                continue;
            }
        }
        if (this.bag) {
            this.bagItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.bag._id)
                .slice(1)
                // Only direct children of the bag, not mods of bag items
                .filter((i) => itemHelpers_1.default.isDirectChild(this.bag, i));
        }
        if (this.tacticalVest) {
            const allVestItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.tacticalVest._id)
                .slice(1);
            this.tacticalVestItems = allVestItems.filter((i) => 
            // Everything that is not an armor plate is our item inventory or ammo or cartridge slot
            !helpers.itemHelper.isOfBaseclass(i._tpl, enums_1.BaseClasses.ARMOR_PLATE) &&
                !helpers.itemHelper.isOfBaseclass(i._tpl, enums_1.BaseClasses.AMMO) &&
                !i.slotId?.startsWith(enums_1.OtherSlots.CARTRIDGE) &&
                // Only direct children as well
                itemHelpers_1.default.isDirectChild(this.tacticalVest, i));
            this.armorVestPlates = allPlayerItems.filter((i) => 
            // Technically this means that un-equipped plates in your vest
            //  are included in this, but I don't know how you
            //  would fit a plate in there in there anyway.
            helpers.itemHelper.isOfBaseclass(i._tpl, enums_1.BaseClasses.ARMOR_PLATE));
        }
        if (this.helmet) {
            this.helmetArmorPlates = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.helmet._id)
                .slice(1)
                .filter((i) => 
            // Don't want nvg's or anything
            helpers.itemHelper.isOfBaseclass(i._tpl, enums_1.BaseClasses.ARMOR_PLATE));
        }
        if (this.pockets) {
            this.pocketItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.pockets._id)
                .slice(1)
                .filter((i) => itemHelpers_1.default.isDirectChild(this.pockets, i));
        }
        this.containerItems = helpers.itemHelper
            .findAndReturnChildrenAsItems(allPlayerItems, this.container._id)
            .slice(1)
            .filter((i) => itemHelpers_1.default.isDirectChild(this.container, i));
        // helpers.logger.log("Armor Plates", "yellow");
        // this.armorVestPlates.forEach((i) =>
        //     helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        // );
        // helpers.logger.log("Helmet Plates", "yellow");
        // this.helmetArmorPlates.forEach((i) =>
        //     helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        // );
        // helpers.logger.log("Vest Items", "yellow");
        // this.tacticalVestItems.forEach((i) =>
        //     helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        // );
        // helpers.logger.log("Bag Items", "yellow");
        // this.bagItems.forEach((i) =>
        //     helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        // );
    }
    asList() {
        return [
            ...[this.helmet, ...this.helmetArmorPlates],
            ...[this.tacticalVest, ...this.tacticalVestItems],
            ...[this.armorVest, ...this.armorVestPlates],
            ...[this.bag, ...this.bagItems],
            ...[this.pockets, ...this.pocketItems],
            ...[this.container, ...this.containerItems],
            ...this.everythingElse,
        ].filter((i) => i != null);
    }
    dumpItemLogs() {
        this.helmet &&
            InventoryHelpers.dumpInventory(this.helmetArmorPlates, "Helmet Plates");
        this.tacticalVest &&
            InventoryHelpers.dumpInventory([this.tacticalVest, ...this.tacticalVestItems], "Vest");
        InventoryHelpers.dumpInventory(this.armorVestPlates, "Vest Plates");
        this.bag &&
            InventoryHelpers.dumpInventory([this.bag, ...this.bagItems], "Backpack");
        this.pockets &&
            InventoryHelpers.dumpInventory([this.pockets, ...this.pocketItems], "Pockets");
        InventoryHelpers.dumpInventory([this.container, ...this.containerItems], "Container");
    }
}
exports.PMCInventory = PMCInventory;
class InventoryHelpers {
    static helpers;
    static extractItemAndContents(slotID, inventory) {
        let item;
        const contents = [];
        for (const subItem of inventory) {
            if (subItem.slotId !== slotID)
                continue;
            item = subItem;
        }
        //@ts-expect-error I have no idea what typescript is tripping about here, im doing the damn null check
        if (item == null) {
            InventoryHelpers.helpers.logger.log("LINE 208 INVENTORY HELPERS IS FUCKED!!!!", "red");
            return [null, null];
        }
        for (const subItem of inventory) {
            if (subItem.parentId !== item._id)
                continue;
            contents.push(subItem);
        }
        return [item, contents];
    }
    static clonePMCInv(pmcData) {
        return InventoryHelpers.helpers.cloner.clone(pmcData.Inventory.items);
    }
    static removeFIRFromInventory(inventory) {
        const dbItems = InventoryHelpers.helpers.databaseService.getItems();
        const itemsToRemovePropertyFrom = inventory.filter((item) => 
        // Has upd object + upd.SpawnedInSession property + not a quest item
        item.upd?.SpawnedInSession && !dbItems[item._tpl]._props.QuestItem);
        for (const item of itemsToRemovePropertyFrom) {
            if (item.upd) {
                item.upd.SpawnedInSession = false;
            }
        }
    }
    static selectPercentageOfItemsFromInventory(src, percentage) {
        const selections = [];
        const pAsDecimal = InventoryHelpers.helpers.randomUtil.randInt(percentage.min, percentage.max + 1) / 100;
        InventoryHelpers.helpers.logger.log(`Taking "${Math.floor(pAsDecimal * 100)}%" of "${src.length}" items"`, "yellow");
        let itemsToTake = Math.floor(src.length * pAsDecimal);
        while (itemsToTake > 0) {
            selections.push(InventoryHelpers.helpers.randomUtil.getArrayValue(src));
            itemsToTake--;
        }
        return selections;
    }
    static objectToStr(obj) {
        if (typeof obj !== "object" || obj === null) {
            return String(obj);
        }
        let result = "{";
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result += `"${key}":${InventoryHelpers.objectToStr(obj[key])},`;
            }
        }
        if (result.length > 1) {
            result = result.slice(0, -1);
        }
        result += "}";
        return result;
    }
    static dumpInventory(inventory, label, color) {
        if (inventory == null) {
            this.helpers.logger.log(`Inventory${label ? `: ${label}` : "-"}\nInventory was null or undefined!`, "Red");
            return;
        }
        this.helpers.logger.log(`Contents of inventory${label ? `: ${label}` : "-"}`, "yellow");
        for (const subItem of inventory) {
            //prettier-ignore
            this.helpers.logger.log(`{ 
"Slot ID": "${subItem.slotId}"
"Has UPD": "${subItem.upd ? InventoryHelpers.objectToStr(subItem.upd) : "false"}"
"Parent ID": "${subItem.parentId || "None"}"
"ID": "${subItem._id}"
"Location": "${subItem.location ? InventoryHelpers.objectToStr(subItem.location) : "false"} }"
"TPL": "${subItem._tpl}"
"Cannon Name": "${this.helpers.itemHelper.getItemName(subItem._tpl)}"
},`, color ?? "yellow");
        }
        this.helpers.logger.log("\n", "white");
    }
}
exports.default = InventoryHelpers;
