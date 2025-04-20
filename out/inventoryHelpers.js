"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PMCInventory = void 0;
const enums_1 = require("./enums");
class PMCInventory {
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
    holsterWeapon;
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
        for (const item of allPlayerItems) {
            if (item.slotId?.startsWith("Headwear")) {
                this.helmet = item;
            }
            else if (item.slotId?.startsWith("Backpack")) {
                this.bag = item;
            }
            else if (item.slotId?.startsWith("TacticalVest")) {
                this.tacticalVest = item;
            }
            else if (item.slotId?.startsWith("ArmorVest")) {
                this.armorVest = item;
            }
            else if (item.slotId?.startsWith("Pockets")) {
                this.pockets = item;
            }
            else if (item.slotId?.startsWith("FirstPrimary")) {
                this.primary = item;
            }
            else if (item.slotId?.startsWith("SecondPrimary")) {
                this.secondary = item;
            }
            else if (item.slotId?.startsWith("Holster")) {
                this.holsterWeapon = item;
            }
            else if (item.slotId?.startsWith("SecuredContainer")) {
                this.container = item;
            }
        }
        if (this.bag) {
            this.bagItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.bag._id)
                .slice(1);
        }
        if (this.tacticalVest) {
            const allVestItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.tacticalVest._id)
                .slice(1);
            this.tacticalVestItems = allVestItems.filter((i) => 
            // Everything that is not an armor plate is our item inventory.
            !helpers.itemHelper.isOfBaseclass(i._tpl, enums_1.BaseClasses.ARMOR_PLATE));
            this.armorVestPlates = allPlayerItems.filter((i) => 
            // Technically this means that un-equipped plates in your vest
            //  inventory slots are included in this, but I don't know how you
            //  would fit a plate in the item slots in there anyway.
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
                .slice(1);
        }
        this.containerItems = helpers.itemHelper
            .findAndReturnChildrenAsItems(allPlayerItems, this.container._id)
            .slice(1);
        helpers.logger.log("Armor Plates", "yellow");
        this.armorVestPlates.forEach((i) => helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow"));
        helpers.logger.log("Helmet Plates", "yellow");
        this.helmetArmorPlates.forEach((i) => helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow"));
        helpers.logger.log("Vest Items", "yellow");
        this.tacticalVestItems.forEach((i) => helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow"));
    }
    dump() {
        // prettier-ignore
        this.tacticalVest && InventoryHelpers.dumpInventory([this.tacticalVest, ...this.tacticalVestItems], "Vest");
        // prettier-ignore
        this.bag && InventoryHelpers.dumpInventory([this.bag, ...this.bagItems], "Backpack");
        // prettier-ignore
        this.pockets && InventoryHelpers.dumpInventory([this.pockets, ...this.pocketItems], "Pockets");
        // prettier-ignore
        InventoryHelpers.dumpInventory([this.container, ...this.containerItems], "Container");
    }
}
exports.PMCInventory = PMCInventory;
class InventoryHelpers {
    static helpers;
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
"Has UPD": "${subItem.upd != null}"
"Parent ID": "${subItem.parentId || "None"}"
"ID": "${subItem._id}"
"Location": "${subItem.location}"
"TPL": "${subItem._tpl}"
"Cannon Name": "${this.helpers.itemHelper.getItemName(subItem._tpl)}"
},`, color ?? "yellow");
        }
        this.helpers.logger.log("\n", "white");
    }
}
exports.default = InventoryHelpers;
