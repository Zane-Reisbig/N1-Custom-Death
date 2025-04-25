import Helpers from "./helpers";
import ItemHelpers from "./itemHelpers";

import { BaseClasses, EquipmentSlots, OtherSlots } from "../Definitions/enums";

import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IItem } from "@spt/models/eft/common/tables/IItem";

export class PMCInventory {
    everythingElse: IItem[];

    helmet?: IItem;
    helmetArmorPlates: IItem[];

    bag?: IItem;
    bagItems: IItem[];

    tacticalVest?: IItem;
    tacticalVestItems: IItem[];

    armorVest?: IItem;
    armorVestPlates: IItem[];

    primary?: IItem;
    secondary?: IItem;
    holster?: IItem;

    pockets?: IItem;
    pocketItems: IItem[];

    container!: IItem;
    containerItems: IItem[];

    constructor(pmcData: IPmcData, helpers: Helpers) {
        this.bagItems = [];
        this.tacticalVestItems = [];
        this.pocketItems = [];
        this.containerItems = [];
        this.armorVestPlates = [];
        this.helmetArmorPlates = [];

        const allPlayerItems = helpers.itemHelper.findAndReturnChildrenAsItems(
            pmcData.Inventory.items,
            pmcData.Inventory.equipment
        );

        this.everythingElse = pmcData.Inventory.items.filter(
            (i) => i.parentId !== pmcData.Inventory.equipment
        );

        for (const item of allPlayerItems) {
            if (item.slotId?.startsWith(EquipmentSlots.HEADWEAR)) {
                this.helmet = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.BACKPACK)) {
                this.bag = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.TACTICAL_VEST)) {
                this.tacticalVest = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.ARMOR_VEST)) {
                this.armorVest = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.POCKETS)) {
                this.pockets = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.FIRST_PRIMARY_WEAPON)) {
                this.primary = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.SECOND_PRIMARY_WEAPON)) {
                this.secondary = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.HOLSTER)) {
                this.holster = item;
                continue;
            } else if (item.slotId?.startsWith(EquipmentSlots.SECURED_CONTAINER)) {
                this.container = item;
                continue;
            }
        }

        if (this.bag) {
            this.bagItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.bag._id)
                .slice(1)
                // Only direct children of the bag, not mods of bag items
                .filter((i) => ItemHelpers.isDirectChild(this.bag!, i));
        }

        if (this.tacticalVest) {
            const allVestItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.tacticalVest._id)
                .slice(1);

            this.tacticalVestItems = allVestItems.filter(
                (i) =>
                    // Everything that is not an armor plate is our item inventory or ammo or cartridge slot
                    !helpers.itemHelper.isOfBaseclass(i._tpl, BaseClasses.ARMOR_PLATE) &&
                    !helpers.itemHelper.isOfBaseclass(i._tpl, BaseClasses.AMMO) &&
                    !i.slotId?.startsWith(OtherSlots.CARTRIDGE) &&
                    // Only direct children as well
                    ItemHelpers.isDirectChild(this.tacticalVest!, i)
            );

            this.armorVestPlates = allPlayerItems.filter((i) =>
                // Technically this means that un-equipped plates in your vest
                //  are included in this, but I don't know how you
                //  would fit a plate in there in there anyway.
                helpers.itemHelper.isOfBaseclass(i._tpl, BaseClasses.ARMOR_PLATE)
            );
        }

        if (this.helmet) {
            this.helmetArmorPlates = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.helmet._id)
                .slice(1)
                .filter((i) =>
                    // Don't want nvg's or anything
                    helpers.itemHelper.isOfBaseclass(i._tpl, BaseClasses.ARMOR_PLATE)
                );
        }

        if (this.pockets) {
            this.pocketItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.pockets._id)
                .slice(1)
                .filter((i) => ItemHelpers.isDirectChild(this.pockets!, i));
        }

        this.containerItems = helpers.itemHelper
            .findAndReturnChildrenAsItems(allPlayerItems, this.container._id)
            .slice(1)
            .filter((i) => ItemHelpers.isDirectChild(this.container, i));

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
            InventoryHelpers.dumpInventory(
                [this.tacticalVest, ...this.tacticalVestItems],
                "Vest"
            );
        InventoryHelpers.dumpInventory(this.armorVestPlates, "Vest Plates");

        this.bag &&
            InventoryHelpers.dumpInventory([this.bag, ...this.bagItems], "Backpack");

        this.pockets &&
            InventoryHelpers.dumpInventory([this.pockets, ...this.pocketItems], "Pockets");

        InventoryHelpers.dumpInventory(
            [this.container, ...this.containerItems],
            "Container"
        );
    }
}

export default class InventoryHelpers {
    public static helpers: Helpers;

    public static extractItemAndContents(
        slotID: EquipmentSlots,
        inventory: IItem[]
    ): [IItem, IItem[]] | [null, null] {
        let item: IItem;
        const contents: IItem[] = [];

        for (const subItem of inventory) {
            if (subItem.slotId !== slotID) continue;

            item = subItem;
        }

        //@ts-expect-error I have no idea what typescript is tripping about here, im doing the damn null check
        if (item == null) {
            InventoryHelpers.helpers.logger.log(
                "LINE 208 INVENTORY HELPERS IS FUCKED!!!!",
                "red"
            );
            return [null, null];
        }

        for (const subItem of inventory) {
            if (subItem.parentId !== item._id) continue;

            contents.push(subItem);
        }

        return [item, contents];
    }

    public static clonePMCInv(pmcData: IPmcData) {
        return InventoryHelpers.helpers.cloner.clone(pmcData.Inventory.items);
    }

    public static removeFIRFromInventory(inventory: IItem[]) {
        const dbItems = InventoryHelpers.helpers.databaseService.getItems();
        const itemsToRemovePropertyFrom = inventory.filter(
            (item) =>
                // Has upd object + upd.SpawnedInSession property + not a quest item
                item.upd?.SpawnedInSession && !dbItems[item._tpl]._props.QuestItem
        );

        for (const item of itemsToRemovePropertyFrom) {
            if (item.upd) {
                item.upd.SpawnedInSession = false;
            }
        }
    }

    public static selectPercentageOfItemsFromInventory(
        src: IItem[],
        percentage: { min: number; max: number }
    ) {
        const selections: IItem[] = [];

        const pAsDecimal =
            InventoryHelpers.helpers.randomUtil.randInt(
                percentage.min,
                percentage.max + 1
            ) / 100;

        InventoryHelpers.helpers.logger.log(
            `Taking "${Math.floor(pAsDecimal * 100)}%" of "${src.length}" items"`,
            "yellow"
        );

        let itemsToTake = Math.floor(src.length * pAsDecimal);

        while (itemsToTake > 0) {
            selections.push(InventoryHelpers.helpers.randomUtil.getArrayValue(src));
            itemsToTake--;
        }

        return selections;
    }

    public static objectToStr(obj: { [key: string]: any }) {
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

    public static dumpInventory(inventory?: IItem[], label?: string, color?: string) {
        if (inventory == null) {
            this.helpers.logger.log(
                `Inventory${label ? `: ${label}` : "-"}\nInventory was null or undefined!`,
                "Red"
            );

            return;
        }

        this.helpers.logger.log(
            `Contents of inventory${label ? `: ${label}` : "-"}`,
            "yellow"
        );

        for (const subItem of inventory) {
            //prettier-ignore
            this.helpers.logger.log(
                `{ 
"Slot ID": "${subItem.slotId}"
"Has UPD": "${subItem.upd ? InventoryHelpers.objectToStr(subItem.upd) : "false"}"
"Parent ID": "${subItem.parentId || "None"}"
"ID": "${subItem._id}"
"Location": "${subItem.location ? InventoryHelpers.objectToStr(subItem.location as {[ key: string ]: any}) : "false"} }"
"TPL": "${subItem._tpl}"
"Cannon Name": "${this.helpers.itemHelper.getItemName(subItem._tpl)}"
},`, color ?? "yellow");
        }

        this.helpers.logger.log("\n", "white");
    }
}
