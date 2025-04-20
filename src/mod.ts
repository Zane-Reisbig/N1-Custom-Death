import { DependencyContainer } from "tsyringe";
import Helpers from "./helpers";
import Source, { SessionDetails } from "./originalEndRaid";
import ItemTransferHelper from "./itemTransferHelper";
import PlayerStatusDetails from "./playerStatusDetails";
import { LocationLifecycleService } from "@spt/services/LocationLifecycleService";
import InventoryHelpers, { PMCInventory, TSlotId } from "./inventoryHelpers";
import { ISptProfile } from "@spt/models/eft/profile/ISptProfile";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IItem } from "@spt/models/eft/common/tables/IItem";
import { IEndLocalRaidRequestData } from "@spt/models/eft/match/IEndLocalRaidRequestData";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IStartLocalRaidRequestData } from "@spt/models/eft/match/IStartLocalRaidRequestData";
import { IArmorMaterials } from "@spt/models/eft/common/IGlobals";
import { IProps, ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
const config = {
    // The whole point of the Mod
    // Set to false to keep your items
    // Works for that too 👍
    DoRandomItemLossOnDeath: true,

    // This is percentage of total items.
    // I.E. 10 items => 50% roll = 5 items removed
    LossPercentages: {
        // They are gonna go thru ur bag.
        bag: { min: 20, max: 50 },

        // They might pat you down for mags, but who's keepin' stuff in there right?
        vest: { min: 0, max: 20 },

        // A good chance if someone kills ya- they'll go thru ur pockets
        pocket: { min: 20, max: 100 },
    },

    // Items with durability will lose some on death
    DoDurabilityLoss: true,

    // For ~5 raids you can keep ur shit
    DurabilityLossPercentages: {
        // Very good change u got Head/Eyes'd- I want a break.
        Helmet: { min: 5, max: 10 },

        // Maybe they hir ur vest too, who am I to say.
        Vest: { min: 10, max: 15 },

        PrimaryWeapon: { min: 15, max: 25 },
        SecondaryWeapon: { min: 10, max: 25 },
        HolsterWeapon: { min: 10, max: 20 },
    },

    RemoveFIR: {
        // I love a good actually secure container
        SecureContainerItems: false,

        Backpack: true,
        BackpackItems: true,

        Vest: true,
        VestItems: true,

        PocketItems: true,

        PrimaryWeapon: true,
        SecondaryWeapon: true,
        HolsterWeapon: true,
    },
};

class Mod implements IPreSptLoadMod {
    private static container: DependencyContainer;
    private static _helpers: Helpers;

    private static get helpers() {
        this._helpers = Helpers.get(Mod.container);
        return Mod._helpers;
    }

    private static removeFIRFromInventory(inventory: IItem[]) {
        const dbItems = Mod.helpers.databaseService.getItems();
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

    private static changeDurabiltityByPercentage(
        src: IItem,
        srcDetails: ITemplateItem,
        percentage: { min: number; max: number },
        options?: { isArmor: boolean }
    ) {
        if (src.upd == null || src.upd.Repairable == null) {
            Mod.helpers.logger.error(
                `Request Dura Change for ${Mod.helpers.itemHelper.getItemName(
                    src._tpl
                )} invalid!`
            );
            return;
        }

        const itemMaxDurability = Mod.helpers.cloner.clone(
            src.upd!.Repairable!.MaxDurability
        );
        const itemCurrentDurability = Mod.helpers.cloner.clone(
            src.upd!.Repairable!.Durability
        );
        const itemCurrentMaxDurability = Mod.helpers.cloner.clone(
            src.upd!.Repairable!.MaxDurability
        );

        const randPercentage = Mod.helpers.randomUtil.getInt(
            percentage.min,
            percentage.max
        );

        // Same with Max Durability
        let newCurrentMaxDurability =
            itemCurrentMaxDurability - (randPercentage / 100) * itemMaxDurability;

        // Ensure new max isnt above items max
        if (newCurrentMaxDurability > itemMaxDurability) {
            newCurrentMaxDurability = itemMaxDurability;
        }

        // Then take a percentage of that
        // Take percentage of total durability, not current
        let newCurrentDurability =
            itemCurrentMaxDurability - (randPercentage / 100) * itemCurrentDurability;

        // Ensure new current isnt above items max
        if (newCurrentDurability > itemMaxDurability) {
            newCurrentDurability = itemMaxDurability;
        }

        // Update Repairable properties with new values after repair
        src.upd!.Repairable = {
            Durability: newCurrentDurability,
            MaxDurability: newCurrentMaxDurability,
        };
    }

    private static selectPercentageOfItems(
        src: IItem[],
        percentage: { min: number; max: number }
    ) {
        const selections: IItem[] = [];

        const pAsDecimal =
            Mod.helpers.randomUtil.randInt(percentage.min, percentage.max + 1) / 100;

        Mod.helpers.logger.log(
            `Taking "${Math.floor(pAsDecimal * 100)}%" of "${src.length}" items"`,
            "yellow"
        );

        let itemsToTake = Math.floor(src.length * pAsDecimal);

        while (itemsToTake > 0) {
            selections.push(Mod.helpers.randomUtil.getArrayValue(src));
            itemsToTake--;
        }

        return selections;
    }

    private static doDurabilityChange(playerInv: PMCInventory) {
        // This sucks

        // Helmet Before

        if (playerInv.helmet) {
            for (const plate of playerInv.helmetArmorPlates) {
                Mod.helpers.logger.log(
                    `Helmet Plate Durability: ${
                        plate.upd!.Repairable?.Durability
                    }\nMax Percent: ${plate.upd!.Repairable?.MaxDurability}`,
                    "yellow"
                );

                plate.upd &&
                    plate.upd.Repairable &&
                    Mod.changeDurabiltityByPercentage(
                        plate,
                        Mod.helpers.databaseService.getItems()[plate._tpl],
                        config.DurabilityLossPercentages.Vest,
                        { isArmor: true }
                    );

                Mod.helpers.logger.log(
                    `Helmet Plate Durability: ${
                        plate.upd!.Repairable?.Durability
                    }\nMax Percent: ${plate.upd!.Repairable?.MaxDurability}`,
                    "red"
                );
            }
        } else {
            Mod.helpers.logger.log("No Helmet to damage", "green");
        }

        // Helmet After

        // Vest Before

        if (playerInv.armorVest || playerInv.tacticalVest) {
            for (const plate of playerInv.armorVestPlates) {
                Mod.helpers.logger.log(
                    `Vest Plate Durability: ${
                        plate.upd!.Repairable?.Durability
                    }\nMax Percent: ${plate.upd!.Repairable?.MaxDurability}`,
                    "yellow"
                );

                plate.upd &&
                    Mod.changeDurabiltityByPercentage(
                        plate,
                        Mod.helpers.databaseService.getItems()[plate._tpl],
                        config.DurabilityLossPercentages.Vest,
                        { isArmor: true }
                    );

                Mod.helpers.logger.log(
                    `Vest Plate Durability: ${
                        plate.upd!.Repairable?.Durability
                    }\nMax Percent: ${plate.upd!.Repairable?.MaxDurability}`,
                    "red"
                );
            }
        } else {
            Mod.helpers.logger.log("No Vest Or Rig Plates To damage", "green");
        }

        // Vest After

        // Primary Before

        if (playerInv.primary) {
            Mod.helpers.logger.log(
                `First Primary Dura Percent: ${
                    playerInv.primary.upd!.Repairable?.Durability
                }\nMax Percent: ${playerInv.primary.upd!.Repairable?.MaxDurability}`,
                "yellow"
            );

            Mod.changeDurabiltityByPercentage(
                playerInv.primary,
                Mod.helpers.databaseService.getItems()[playerInv.primary._tpl],
                config.DurabilityLossPercentages.PrimaryWeapon
            );

            Mod.helpers.logger.log(
                `First Primary Dura Percent: ${
                    playerInv.primary.upd!.Repairable?.Durability
                }\nMax Percent: ${playerInv.primary.upd!.Repairable?.MaxDurability}`,
                "red"
            );
        } else {
            Mod.helpers.logger.log("No Primay to damage", "green");
        }

        // Primary After

        // Secondary Before

        if (playerInv.secondary) {
            Mod.helpers.logger.log(
                `Second Primary Dura Percent: ${
                    playerInv.secondary.upd!.Repairable?.Durability
                }\nMax Percent: ${playerInv.secondary.upd!.Repairable?.MaxDurability}`,
                "yellow"
            );

            Mod.changeDurabiltityByPercentage(
                playerInv.secondary,
                Mod.helpers.databaseService.getItems()[playerInv.secondary._tpl],
                config.DurabilityLossPercentages.SecondaryWeapon
            );

            Mod.helpers.logger.log(
                `Second Primary Dura Percent: ${
                    playerInv.secondary.upd!.Repairable?.Durability
                }\nMax Percent: ${playerInv.secondary.upd!.Repairable?.MaxDurability}`,
                "red"
            );
        } else {
            Mod.helpers.logger.log("No Secondary to damage", "green");
        }

        // Secondary After

        // Holster Before

        if (playerInv.holsterWeapon) {
            Mod.helpers.logger.log(
                `Holster Weapon Dura Percent: ${
                    playerInv.holsterWeapon.upd!.Repairable?.Durability
                }\nMax Percent: ${playerInv.holsterWeapon.upd!.Repairable?.MaxDurability}`,
                "yellow"
            );
            Mod.changeDurabiltityByPercentage(
                playerInv.holsterWeapon,
                Mod.helpers.databaseService.getItems()[playerInv.holsterWeapon._tpl],
                config.DurabilityLossPercentages.HolsterWeapon
            );

            Mod.helpers.logger.log(
                `Holster Weapon Dura Percent: ${
                    playerInv.holsterWeapon.upd!.Repairable?.Durability
                }\nMax Percent: ${playerInv.holsterWeapon.upd!.Repairable?.MaxDurability}`,
                "red"
            );
        } else {
            Mod.helpers.logger.log("No Holster Weapon to damage", "green");
        }

        // Holster After
    }

    private static doFIRChange(playerInv: PMCInventory) {
        Mod.helpers.logger.log(
            `RemoveFIRFromBackpack: ${config.RemoveFIR.BackpackItems}`,
            "yellow"
        );
        if (config.RemoveFIR.BackpackItems) {
            Mod.removeFIRFromInventory(playerInv.bagItems);
        }

        Mod.helpers.logger.log(`RemoveFIRFromVest: ${config.RemoveFIR.Vest}`, "yellow");
        if (config.RemoveFIR.VestItems) {
            Mod.removeFIRFromInventory(playerInv.tacticalVestItems);
        }

        Mod.helpers.logger.log(
            `RemoveFIRFromPockets: ${config.RemoveFIR.PocketItems}`,
            "yellow"
        );
        if (config.RemoveFIR.PocketItems) {
            Mod.removeFIRFromInventory(playerInv.pocketItems);
        }

        Mod.helpers.logger.log(
            `RemoveFIRFromSecureContainer: ${config.RemoveFIR.SecureContainerItems}`,
            "yellow"
        );
        if (config.RemoveFIR.SecureContainerItems) {
            Mod.removeFIRFromInventory(playerInv.containerItems);
        }
    }

    private static doRemoval(
        playerInv: PMCInventory,
        playerData: IPmcData,
        sessionID: string
    ) {
        const bagRemoval = Mod.selectPercentageOfItems(
            playerInv.bagItems,
            config.LossPercentages.bag
        );
        InventoryHelpers.dumpInventory(bagRemoval, "Bag Removal", "red");

        const pocketRemoval = Mod.selectPercentageOfItems(
            playerInv.pocketItems,
            config.LossPercentages.pocket
        );
        InventoryHelpers.dumpInventory(pocketRemoval, "Pocket Removal", "red");

        const vestRemoval = Mod.selectPercentageOfItems(
            playerInv.bagItems,
            config.LossPercentages.vest
        );
        InventoryHelpers.dumpInventory(vestRemoval, "Vest Removal", "red");

        for (const item of [...bagRemoval, ...pocketRemoval, ...vestRemoval]) {
            Mod.helpers.sptInventoryHelper.removeItem(playerData, item._id, sessionID);
        }
    }

    private static setInventory(playerData: IPmcData, sessionID: string) {
        Mod.helpers.logger.log("We are setting the inventory on death!", "green");

        const playerInv = new PMCInventory(playerData, Mod.helpers);

        Mod.doRemoval(playerInv, playerData, sessionID);

        Mod.doFIRChange(playerInv);

        if (config.DoDurabilityLoss) {
            Mod.doDurabilityChange(playerInv);
        }
    }

    private static endLocalRaid(sessionID: string, request: IEndLocalRaidRequestData) {
        const sourceInstance = new Source();
        Source.validateMembers(sourceInstance);

        sourceInstance.endLocalRaid(sessionID, request);
    }

    public preSptLoad(container: DependencyContainer) {
        Mod.container = container;

        // Dear god do not forget to set helpers on other classes
        Source.helpers = Mod.helpers;
        ItemTransferHelper.helpers = Mod.helpers;
        PlayerStatusDetails.helpers = Mod.helpers;
        InventoryHelpers.helpers = Mod.helpers;
        // srsly \\

        // This is the actual mod, the rest of this mess is the re-implementation
        //  of the LocationLifeCycleService, starting at the public method "endLocalRaid"
        //
        // This hooks in after the "postRaidPMC" function from the original spt/server
        Source.setPlayerInventoryOnDeath = Mod.setInventory;

        // This is the hook from the tutorial!
        // Woo-Hooo!!
        container.afterResolution(
            "LocationLifecycleService",

            //@ts-expect-error This is correct actually
            (_t, result: LocationLifecycleService) => {
                result.endLocalRaid = Mod.endLocalRaid;
            },
            { frequency: "Always" }
        );
    }
}

export const mod = new Mod();
