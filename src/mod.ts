import { DependencyContainer } from "tsyringe";

import { SPTEndLocalRaid } from "./SPTSource/endLocalRaid";
import { SPTStartLocalRaid } from "./SPTSource/startLocalRaid";

import Timers from "./helpers/timers";
import Helpers from "./helpers/helpers";
import ItemHelpers from "./helpers/itemHelpers";
import InventoryHelpers, { PMCInventory } from "./helpers/inventoryHelpers";
import ItemTransferHelper from "./helpers/itemTransferHelper";
import PlayerStatusDetails from "./Definitions/playerStatusDetails";

import { ConfigTypes, ContextVariableType, EquipmentSlots } from "./Definitions/enums";

import { LocationLifecycleService } from "@spt/services/LocationLifecycleService";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ContextVariable } from "@spt/context/ContextVariable";

import * as config from "./config.json";
import { IItem } from "@spt/models/eft/common/tables/IItem";
import { IInsuranceConfig } from "@spt/models/spt/config/IInsuranceConfig";
import { WinstonMainLogger } from "@spt/utils/logging/WinstonMainLogger";
import winston from "winston";

class Mod implements IPreSptLoadMod {
    private static container: DependencyContainer;
    private static endLocalRaidInst: SPTEndLocalRaid;
    private static startLocalRaidInst: SPTStartLocalRaid;

    private static _helpers: Helpers;
    private static get helpers() {
        if (Mod._helpers == null) {
            Mod._helpers = Helpers.get(Mod.container);
        }

        return Mod._helpers;
    }

    private static preRaidInventory?: IItem[];

    private static doDurabilityChange(playerInv: PMCInventory) {
        // This sucks

        const allItems = Mod.helpers.databaseService.getItems();

        // Helmet Before
        if (playerInv.helmet) {
            for (const plate of playerInv.helmetArmorPlates) {
                plate.upd &&
                    plate.upd.Repairable &&
                    ItemHelpers.changeDurabiltityByPercentage(
                        plate,
                        allItems[plate._tpl],
                        config.OnDeathBehavior.DoRandomItemLossOnDeath
                            .DurabilityLossPercentages.Vest,
                        { isArmor: true }
                    );
            }
        } else {
            Mod.helpers.logger.log("No Helmet to damage", "green");
        }
        // Helmet After

        // Vest Before
        if (playerInv.armorVest || playerInv.tacticalVest) {
            for (const plate of playerInv.armorVestPlates) {
                plate.upd &&
                    ItemHelpers.changeDurabiltityByPercentage(
                        plate,
                        allItems[plate._tpl],
                        config.OnDeathBehavior.DoRandomItemLossOnDeath
                            .DurabilityLossPercentages.Vest,
                        { isArmor: true }
                    );
            }
        } else {
            Mod.helpers.logger.log("No Vest Or Rig Plates To damage", "green");
        }
        // Vest After

        // Primary Before
        if (playerInv.primary) {
            ItemHelpers.changeDurabiltityByPercentage(
                playerInv.primary,
                allItems[playerInv.primary._tpl],
                config.OnDeathBehavior.DoRandomItemLossOnDeath.DurabilityLossPercentages
                    .PrimaryWeapon
            );
        } else {
            Mod.helpers.logger.log("No Primay to damage", "green");
        }
        // Primary After

        // Secondary Before
        if (playerInv.secondary) {
            ItemHelpers.changeDurabiltityByPercentage(
                playerInv.secondary,
                allItems[playerInv.secondary._tpl],
                config.OnDeathBehavior.DoRandomItemLossOnDeath.DurabilityLossPercentages
                    .SecondaryWeapon
            );
        } else {
            Mod.helpers.logger.log("No Secondary to damage", "green");
        }
        // Secondary After

        // Holster Before
        if (playerInv.holster) {
            ItemHelpers.changeDurabiltityByPercentage(
                playerInv.holster,
                allItems[playerInv.holster._tpl],
                config.OnDeathBehavior.DoRandomItemLossOnDeath.DurabilityLossPercentages
                    .HolsterWeapon
            );
        } else {
            Mod.helpers.logger.log("No Holster Weapon to damage", "green");
        }
        // Holster After
    }

    private static doFIRChange(playerInv: PMCInventory) {
        // God damn this one is ugly too

        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.PrimaryWeapon &&
            playerInv.primary
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.primary]);
        }

        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.SecondaryWeapon &&
            playerInv.secondary
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.secondary]);
        }
        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.HolsterWeapon &&
            playerInv.holster
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.holster]);
        }

        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Helmet &&
            playerInv.helmet
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.helmet]);
        }
        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Backpack &&
            playerInv.bag
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.bag]);
        }

        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.BackpackItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.bagItems);
        }
        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Vest &&
            playerInv.tacticalVest
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.tacticalVest]);
        }
        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.Vest &&
            playerInv.armorVest
        ) {
            InventoryHelpers.removeFIRFromInventory([playerInv.armorVest]);
        }

        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.VestItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.tacticalVestItems);
        }

        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.PocketItems) {
            InventoryHelpers.removeFIRFromInventory(playerInv.pocketItems);
        }

        if (
            config.OnDeathBehavior.DoRandomItemLossOnDeath.RemoveFIR.SecureContainerItems
        ) {
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
            config.OnDeathBehavior.DoRandomItemLossOnDeath.ItemLossPercentages.Bag
        );
        InventoryHelpers.dumpInventory(bagRemoval, "Bag Removal", "red");

        const pocketRemoval = InventoryHelpers.selectPercentageOfItemsFromInventory(
            playerInv.pocketItems,
            config.OnDeathBehavior.DoRandomItemLossOnDeath.ItemLossPercentages.Pocket
        );
        InventoryHelpers.dumpInventory(pocketRemoval, "Pocket Removal", "red");

        const vestRemoval = InventoryHelpers.selectPercentageOfItemsFromInventory(
            playerInv.bagItems,
            config.OnDeathBehavior.DoRandomItemLossOnDeath.ItemLossPercentages.Vest
        );
        InventoryHelpers.dumpInventory(vestRemoval, "Vest Removal", "red");

        for (const item of [...bagRemoval, ...pocketRemoval, ...vestRemoval]) {
            Mod.helpers.sptInventoryHelper.removeItem(playerData, item._id, sessionID);
        }
    }

    private static scavChanges(playerData: IPmcData, sessionID: string) {
        if (!config.ScavChanges.Enabled) return;

        const newCooldown = new Date(
            Date.now() / 1000 +
                Helpers.randInt(
                    config.ScavChanges.InstantCooldownOnDeath
                        ? { min: 0, max: 1 }
                        : config.ScavChanges.MaxCooldownRangeInMinutes
                ) *
                    60
        );

        // @ts-expect-error This is valid, Dates can be parsed by 'Date.parse()' lmao
        playerData.Info.SavageLockTime = Date.parse(newCooldown);
    }

    private static resetToPreRaidInventory(pmcData: IPmcData) {
        const currentPlayerInv = InventoryHelpers.clonePMCInv(pmcData);

        if (Mod.preRaidInventory == null) {
            throw new Error("Failed to get player inventory on raid start...");
        }

        const [postRaidContainer, postRaidContainerItems] =
            InventoryHelpers.extractItemAndContents(
                EquipmentSlots.SECURED_CONTAINER,
                currentPlayerInv
            );

        if (postRaidContainer != null) {
            const containerItemIDs: string[] = postRaidContainerItems.reduce(
                (init, cur) => [...init, cur._id],
                [] as string[]
            );

            const deDupedItemList: IItem[] = [];

            for (const item of Mod.preRaidInventory) {
                // remove any item moved to your case in-raid from pre raid inventory
                // no dupes in this dojo
                if (containerItemIDs.includes(item._id)) continue;

                deDupedItemList.push(item);
            }

            const refreshedItems = Mod.helpers.itemHelper.replaceIDs(
                [...deDupedItemList, ...postRaidContainerItems],
                pmcData
            );

            pmcData.Inventory.items = [];
            pmcData.Inventory.items = [...refreshedItems];
        } else {
            Mod.helpers.logger.log("How did you get a container in raid? Crazy.", "red");
        }
    }

    private static doRandomItemLossOnDeath(pmcData: IPmcData, sessionID: string) {
        const playerInv = new PMCInventory(pmcData, Mod.helpers);

        Mod.doFIRChange(playerInv);

        Mod.helpers.logger.log(
            `Removing Items: ${config.OnDeathBehavior.DoRandomItemLossOnDeath.Enabled}`,
            config.OnDeathBehavior.DoRandomItemLossOnDeath ? "red" : "green"
        );
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath) {
            Mod.doRemoval(playerInv, pmcData, sessionID);
        }

        Mod.helpers.logger.log(
            `Durability Lost?: ${config.OnDeathBehavior.DoRandomItemLossOnDeath.DoDurabilityLoss}`,
            config.OnDeathBehavior.DoRandomItemLossOnDeath.DoDurabilityLoss
                ? "red"
                : "green"
        );
        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.DoDurabilityLoss) {
            Mod.doDurabilityChange(playerInv);
        }
    }

    private static runInventoryActions(pmcData: IPmcData, sessionID: string) {
        Mod.helpers.logger.log("We are setting the inventory on death!", "green");

        if (config.OnDeathBehavior.DoRandomItemLossOnDeath.Enabled) {
            Mod.doRandomItemLossOnDeath(pmcData, sessionID);
            Mod.helpers.logger.log("Inventory has been picked thru!", "green");
        } else if (config.OnDeathBehavior.ResetToPreRaidInventory.Enabled) {
            Mod.resetToPreRaidInventory(pmcData);
            Mod.helpers.logger.log("Inventory reset!", "green");
        } else {
            Mod.helpers.logger.log("Inventory left untouched...", "green");
        }
    }

    public preSptLoad(container: DependencyContainer) {
        Mod.container = container;

        Mod.endLocalRaidInst = new SPTEndLocalRaid();
        Mod.startLocalRaidInst = new SPTStartLocalRaid();
        SPTEndLocalRaid.onPMCDeath = Mod.runInventoryActions;
        SPTEndLocalRaid.onScavDeath = Mod.scavChanges;

        SPTStartLocalRaid.onRaidStart = (pmcData, sessionID, _res) => {
            Mod.helpers.logger.log(`SessionID: ${sessionID}`, "green");

            Mod.preRaidInventory = InventoryHelpers.clonePMCInv(pmcData);

            if (config.InsuranceChanges.Enabled) {
                const insuranceConfig =
                    Mod.helpers.configServer.getConfig<IInsuranceConfig>(
                        ConfigTypes.INSURANCE
                    );
                if (config.InsuranceChanges.EnableReturnTimeOverride) {
                    insuranceConfig.returnTimeOverrideSeconds = Math.floor(
                        Helpers.randInt(config.InsuranceChanges.MaxReturnRangeInMinutes) *
                            60
                    );

                    insuranceConfig.runIntervalSeconds =
                        insuranceConfig.returnTimeOverrideSeconds / 2;

                    Mod.helpers.logger.log(
                        `Insurance Returns in: ${
                            insuranceConfig.returnTimeOverrideSeconds / 60
                        } minutes`,
                        "green"
                    );

                    Mod.helpers.logger.log(
                        `Next Insurance Run in: ${
                            insuranceConfig.runIntervalSeconds / 60
                        } minutes`,
                        "green"
                    );
                }
            }
        };

        // Dear god do not forget to set helpers on other classes
        SPTStartLocalRaid.helpers = Mod.helpers;
        SPTEndLocalRaid.helpers = Mod.helpers;

        ItemTransferHelper.helpers = Mod.helpers;
        PlayerStatusDetails.helpers = Mod.helpers;
        InventoryHelpers.helpers = Mod.helpers;
        ItemHelpers.helpers = Mod.helpers;
        // srsly \\

        // Thankfully we can just update the config and SPT will do the rest
        if (config.InsuranceChanges.Enabled) {
            const insuranceConfig = Mod.helpers.configServer.getConfig<IInsuranceConfig>(
                ConfigTypes.INSURANCE
            );

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
        container.afterResolution(
            "LocationLifecycleService",

            //@ts-expect-error This is correct actually
            (_t, result: LocationLifecycleService) => {
                result.endLocalRaid = Mod.endLocalRaidInst.endLocalRaid;
                result.startLocalRaid = Mod.startLocalRaidInst.startLocalRaid;
            },
            { frequency: "Always" }
        );

        // Let those doggies lay for ~20 minutes (default scav timer) if so chosen in the config
        if (!config.ScavChanges.Enabled || !config.ScavChanges.InstantCooldownOnLogin)
            return;

        // Otherwise wait for the session and reset that shit yo'
        Timers.waitForNonFalsey<ContextVariable>(
            () =>
                Mod.helpers.applicationContext.getLatestValue(
                    ContextVariableType.SESSION_ID
                ),
            (val) => {
                const scav = Mod.helpers.profileHelper.getScavProfile(
                    val.getValue<string>()
                );

                // set to 10 secs
                scav.Info.SavageLockTime = Date.now() / 1000 + 10;
                Mod.helpers.logger.log("Scav cooldown reset!", "green");
            }
        );
    }
}

export const mod = new Mod();

// TODO: This raid never happend, I.E. A "That's bullshit" command
// TODO: Playtest and make sure nothing is broken
