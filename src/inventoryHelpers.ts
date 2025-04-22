import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IItem, IUpd } from "@spt/models/eft/common/tables/IItem";
import Helpers from "./helpers";
import ItemHelpers from "./itemHelpers";
import { BaseClasses, EquipmentSlots, OtherSlots } from "./enums";

export class PMCInventory {
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
    holsterWeapon?: IItem;

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

        for (const item of allPlayerItems) {
            if (item.slotId?.startsWith(EquipmentSlots.HEADWEAR)) {
                this.helmet = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.BACKPACK)) {
                this.bag = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.TACTICAL_VEST)) {
                this.tacticalVest = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.ARMOR_VEST)) {
                this.armorVest = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.POCKETS)) {
                this.pockets = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.FIRST_PRIMARY_WEAPON)) {
                this.primary = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.SECOND_PRIMARY_WEAPON)) {
                this.secondary = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.HOLSTER)) {
                this.holsterWeapon = item;
            } else if (item.slotId?.startsWith(EquipmentSlots.SECURED_CONTAINER)) {
                this.container = item;
            }
        }

        if (this.bag) {
            this.bagItems = helpers.itemHelper
                .findAndReturnChildrenAsItems(allPlayerItems, this.bag._id)
                .slice(1)
                // Only direct children of the bag, not mods of bag items
                .filter((i) => i.parentId === this.bag!._id);
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
                    i.parentId === this.tacticalVest!._id
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
                .filter((i) => i.parentId === this.pockets!._id);
        }

        this.containerItems = helpers.itemHelper
            .findAndReturnChildrenAsItems(allPlayerItems, this.container._id)
            .slice(1);

        helpers.logger.log("Armor Plates", "yellow");
        this.armorVestPlates.forEach((i) =>
            helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        );

        helpers.logger.log("Helmet Plates", "yellow");
        this.helmetArmorPlates.forEach((i) =>
            helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        );

        helpers.logger.log("Vest Items", "yellow");
        this.tacticalVestItems.forEach((i) =>
            helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        );

        helpers.logger.log("Bag Items", "yellow");
        this.bagItems.forEach((i) =>
            helpers.logger.log(helpers.itemHelper.getItemName(i._tpl), "yellow")
        );
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

export default class InventoryHelpers {
    public static helpers: Helpers;

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
