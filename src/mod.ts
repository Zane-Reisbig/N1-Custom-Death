import { DependencyContainer } from "tsyringe";
import Helpers from "./helpers";
import Source from "./originalEndRaid";
import ItemTransferHelper from "./itemTransferHelper";
import PlayerStatusDetails from "./playerStatusDetails";
import { LocationLifecycleService } from "@spt/services/LocationLifecycleService";
import InventoryHelpers, { PMCInventory } from "./inventoryHelpers";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IEndLocalRaidRequestData } from "@spt/models/eft/match/IEndLocalRaidRequestData";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";

import * as config from "./config.json";
import ItemHelpers from "./itemHelpers";

class Mod implements IPreSptLoadMod {
    private static container: DependencyContainer;
    private static _helpers: Helpers;

    private static get helpers() {
        this._helpers = Helpers.get(Mod.container);
        return Mod._helpers;
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
                    ItemHelpers.changeDurabiltityByPercentage(
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
                    ItemHelpers.changeDurabiltityByPercentage(
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

            ItemHelpers.changeDurabiltityByPercentage(
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

            ItemHelpers.changeDurabiltityByPercentage(
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
            ItemHelpers.changeDurabiltityByPercentage(
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
        // God damn this one is ugly too

        if (config.RemoveFIR.PrimaryWeapon && playerInv.primary) {
            InventoryHelpers.removeFIRFromInventory([playerInv.primary]);
        }

        if (config.RemoveFIR.SecondaryWeapon && playerInv.secondary) {
            InventoryHelpers.removeFIRFromInventory([playerInv.secondary]);
        }
        if (config.RemoveFIR.HolsterWeapon && playerInv.holsterWeapon) {
            InventoryHelpers.removeFIRFromInventory([playerInv.holsterWeapon]);
        }

        if (config.RemoveFIR.Helmet && playerInv.helmet) {
            InventoryHelpers.removeFIRFromInventory([playerInv.helmet]);
        }
        if (config.RemoveFIR.Backpack && playerInv.bag) {
            InventoryHelpers.removeFIRFromInventory([playerInv.bag]);
        }

        if (config.RemoveFIR.BackpackItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.bagItems);
        }
        if (config.RemoveFIR.Vest && playerInv.tacticalVest) {
            InventoryHelpers.removeFIRFromInventory([playerInv.tacticalVest]);
        }
        if (config.RemoveFIR.Vest && playerInv.armorVest) {
            InventoryHelpers.removeFIRFromInventory([playerInv.armorVest]);
        }

        if (config.RemoveFIR.VestItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.tacticalVestItems);
        }

        if (config.RemoveFIR.PocketItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.pocketItems);
        }

        if (config.RemoveFIR.SecureContainerItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.containerItems);
        }
    }

    private static doRemoval(
        playerInv: PMCInventory,
        playerData: IPmcData,
        sessionID: string
    ) {
        const bagRemoval = InventoryHelpers.selectPercentageOfItemsFromInventory(
            playerInv.bagItems,
            config.ItemLossPercentages.bag
        );
        InventoryHelpers.dumpInventory(bagRemoval, "Bag Removal", "red");

        const pocketRemoval = InventoryHelpers.selectPercentageOfItemsFromInventory(
            playerInv.pocketItems,
            config.ItemLossPercentages.pocket
        );
        InventoryHelpers.dumpInventory(pocketRemoval, "Pocket Removal", "red");

        const vestRemoval = InventoryHelpers.selectPercentageOfItemsFromInventory(
            playerInv.bagItems,
            config.ItemLossPercentages.vest
        );
        InventoryHelpers.dumpInventory(vestRemoval, "Vest Removal", "red");

        for (const item of [...bagRemoval, ...pocketRemoval, ...vestRemoval]) {
            Mod.helpers.sptInventoryHelper.removeItem(playerData, item._id, sessionID);
        }
    }

    private static setInventory(playerData: IPmcData, sessionID: string) {
        Mod.helpers.logger.log("We are setting the inventory on death!", "green");

        const playerInv = new PMCInventory(playerData, Mod.helpers);

        Mod.helpers.logger.log(`Running FIR Change - `, "red");
        Mod.doFIRChange(playerInv);

        Mod.helpers.logger.log(
            `Removing Items: ${config.DoRandomItemLossOnDeath}`,
            config.DoRandomItemLossOnDeath ? "red" : "green"
        );
        if (config.DoRandomItemLossOnDeath) {
            Mod.doRemoval(playerInv, playerData, sessionID);
        }

        Mod.helpers.logger.log(
            `Durability Lost?: ${config.DoDurabilityLoss}`,
            config.DoDurabilityLoss ? "red" : "green"
        );
        if (config.DoDurabilityLoss) {
            Mod.doDurabilityChange(playerInv);
        }
    }

    private static endLocalRaid(sessionID: string, request: IEndLocalRaidRequestData) {
        const sourceInstance = new Source();
        // Source.validateMembers(sourceInstance);

        sourceInstance.endLocalRaid(sessionID, request);
    }

    public preSptLoad(container: DependencyContainer) {
        Mod.container = container;
        // Mod.readSetConfig();

        // Dear god do not forget to set helpers on other classes
        Source.helpers = Mod.helpers;
        ItemTransferHelper.helpers = Mod.helpers;
        PlayerStatusDetails.helpers = Mod.helpers;
        InventoryHelpers.helpers = Mod.helpers;
        ItemHelpers.helpers = Mod.helpers;
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
