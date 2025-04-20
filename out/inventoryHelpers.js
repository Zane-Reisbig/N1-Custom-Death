"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PMCInventory = void 0;
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
            if (item.slotId?.startsWith("Backpack")) {
                this.bag = item;
            }
            if (item.slotId?.startsWith("TacticalVest")) {
                this.tacticalVest = item;
            }
            if (item.slotId?.startsWith("ArmorVest")) {
                this.armorVest = item;
            }
            if (item.slotId?.startsWith("Pockets")) {
                this.pockets = item;
            }
            if (item.slotId?.startsWith("FirstPrimary")) {
                this.primary = item;
            }
            if (item.slotId?.startsWith("SecondPrimary")) {
                this.secondary = item;
            }
            if (item.slotId?.startsWith("Holster")) {
                this.holsterWeapon = item;
            }
            if (item.slotId?.startsWith("SecuredContainer")) {
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
            this.tacticalVestItems = allVestItems.filter((i) => {
                const itemName = helpers.itemHelper.getItemName(i._tpl);
                // Take out integral inserts and plates
                return !itemName.includes("plate") && !itemName.includes("insert");
            });
            this.armorVestPlates = allPlayerItems.filter((i) => {
                const itemName = helpers.itemHelper.getItemName(i._tpl);
                return ((itemName.includes("plate") || itemName.includes("insert")) &&
                    !itemName.includes("plate carrier"));
            });
        }
        // if (this.armorVest) {
        //     this.armorVestPlates = helpers.itemHelper
        //         .findAndReturnChildrenAsItems(allPlayerItems, this.armorVest._id)
        //         .slice(1);
        // }
        if (this.helmet) {
            this.helmetArmorPlates = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.helmet._id)
                .slice(1);
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
        helpers.logger.log("Vest items", "yellow");
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
