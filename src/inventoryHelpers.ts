import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IItem, IUpd } from "@spt/models/eft/common/tables/IItem";
import Helpers from "./helpers";
import ItemHelpers from "./itemHelpers";
import { BaseClasses } from "./enums";

export type TSlotId =
    | "ArmBand"
    | "ArmorVest"
    | "Backpack"
    | "Earpiece"
    | "Eyewear"
    | "FaceCover"
    | "FirstPrimaryWeapon"
    | "Headwear"
    | "Holster"
    | "pocket1"
    | "pocket2"
    | "pocket3"
    | "Scabbard"
    | "SecondPrimaryWeapon"
    | "SecuredContainer"
    | "TacticalVest"
    | "back_plate"
    | "front_plate"
    | "left_side_plate"
    | "right_side_plate"
    | "mod_barrel"
    | "mod_bipod"
    | "mod_catch"
    | "mod_charge"
    | "mod_equipment"
    | "mod_equipment_000"
    | "mod_equipment_001"
    | "mod_equipment_002"
    | "mod_flashlight"
    | "mod_foregrip"
    | "mod_gas_block"
    | "mod_hammer"
    | "mod_handguard"
    | "mod_launcher"
    | "mod_magazine"
    | "mod_mount"
    | "mod_mount_000"
    | "mod_mount_001"
    | "mod_mount_002"
    | "mod_mount_003"
    | "mod_mount_004"
    | "mod_mount_005"
    | "mod_mount_006"
    | "mod_muzzle"
    | "mod_muzzle_000"
    | "mod_muzzle_001"
    | "mod_pistol_grip"
    | "mod_pistol_grip_akms"
    | "mod_pistolgrip"
    | "mod_pistolgrip_000"
    | "mod_reciever"
    | "mod_scope"
    | "mod_scope_000"
    | "mod_scope_001"
    | "mod_scope_002"
    | "mod_scope_003"
    | "mod_sight_front"
    | "mod_sight_rear"
    | "mod_stock"
    | "mod_stock_000"
    | "mod_stock_001"
    | "mod_stock_002"
    | "mod_stock_akms"
    | "mod_stock_axis"
    | "mod_tactical"
    | "mod_tactical001"
    | "mod_tactical002"
    | "mod_tactical_000"
    | "mod_tactical_001"
    | "mod_tactical_002"
    | "mod_tactical_003"
    | "mod_tactical_2"
    | "mod_trigger"
    | "mod_nvg"
    | "hideout";

export type TPlayerSlots =
    | "FaceCover"
    | "Headwear"
    | "Helmet"
    | "Eyewear"
    | "TacticalVest"
    | "ArmorVest"
    | "back_plate"
    | "front_plate"
    | "left_side_plate"
    | "right_side_plate"
    | "main" // Backpack
    | "pocket" // All pockets
    | "pocket1"
    | "pocket2"
    | "pocket3"
    | "FirstPrimaryWeapon"
    | "SecondPrimaryWeapon"
    | "Holster"
    | "SecuredContainer"
    | "Scabbard";

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
            if (item.slotId?.startsWith("Headwear" as TPlayerSlots)) {
                this.helmet = item;
            } else if (item.slotId?.startsWith("Backpack" as TPlayerSlots)) {
                this.bag = item;
            } else if (item.slotId?.startsWith("TacticalVest" as TPlayerSlots)) {
                this.tacticalVest = item;
            } else if (item.slotId?.startsWith("ArmorVest" as TPlayerSlots)) {
                this.armorVest = item;
            } else if (item.slotId?.startsWith("Pockets" as TPlayerSlots)) {
                this.pockets = item;
            } else if (item.slotId?.startsWith("FirstPrimary" as TPlayerSlots)) {
                this.primary = item;
            } else if (item.slotId?.startsWith("SecondPrimary" as TPlayerSlots)) {
                this.secondary = item;
            } else if (item.slotId?.startsWith("Holster" as TPlayerSlots)) {
                this.holsterWeapon = item;
            } else if (item.slotId?.startsWith("SecuredContainer" as TPlayerSlots)) {
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

            this.tacticalVestItems = allVestItems.filter(
                (i) =>
                    // Everything that is not an armor plate is our item inventory.
                    !helpers.itemHelper.isOfBaseclass(i._tpl, BaseClasses.ARMOR_PLATE)
            );

            this.armorVestPlates = allPlayerItems.filter((i) =>
                // Technically this means that un-equipped plates in your vest
                //  inventory slots are included in this, but I don't know how you
                //  would fit a plate in the item slots in there anyway.
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
                .slice(1);
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
