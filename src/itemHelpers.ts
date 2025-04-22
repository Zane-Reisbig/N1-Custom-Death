import { IItem, IUpdRepairable } from "@spt/models/eft/common/tables/IItem";
import { IProps, ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import Helpers from "./helpers";
import { IArmorMaterials } from "@spt/models/eft/common/IGlobals";

export default class ItemHelpers {
    public static helpers: Helpers;

    public static isFoundInRaid(item: IItem) {
        return item.upd && item.upd.SpawnedInSession;
    }

    public static isRepairable(item: IItem) {
        return item.upd && item.upd.Repairable;
    }

    public static getRandomisedArmorRepairDegradationValue(
        armorMaterial: string,
        isRepairKit: boolean,
        armorMax: number,
        traderQualityMultipler: number
    ): number {
        // Degradation value is based on the armor material
        const armorMaterialSettings =
            ItemHelpers.helpers.databaseService.getGlobals().config.ArmorMaterials[
                armorMaterial as keyof IArmorMaterials
            ];

        const minMultiplier = isRepairKit
            ? armorMaterialSettings.MinRepairKitDegradation
            : armorMaterialSettings.MinRepairDegradation;

        const maxMultiplier = isRepairKit
            ? armorMaterialSettings.MaxRepairKitDegradation
            : armorMaterialSettings.MaxRepairDegradation;

        const duraLossPercent = ItemHelpers.helpers.randomUtil.getFloat(
            minMultiplier,
            maxMultiplier
        );
        const duraLossMultipliedByTraderMultiplier =
            duraLossPercent * armorMax * traderQualityMultipler;

        return Number(duraLossMultipliedByTraderMultiplier.toFixed(2));
    }

    public static getRandomisedWeaponRepairDegradationValue(
        itemProps: IProps,
        isRepairKit: boolean,
        weaponMax: number,
        traderQualityMultipler: number
    ): number {
        const minRepairDeg = isRepairKit
            ? itemProps.MinRepairKitDegradation
            : itemProps.MinRepairDegradation;
        let maxRepairDeg = isRepairKit
            ? itemProps.MaxRepairKitDegradation
            : itemProps.MaxRepairDegradation;

        // WORKAROUND: Some items are always 0 when repairkit is true
        if (maxRepairDeg === 0) {
            maxRepairDeg = itemProps.MaxRepairDegradation;
        }

        const duraLossPercent = ItemHelpers.helpers.randomUtil.getFloat(
            minRepairDeg!,
            maxRepairDeg!
        );
        const duraLossMultipliedByTraderMultiplier =
            duraLossPercent * weaponMax * traderQualityMultipler;

        return Number(duraLossMultipliedByTraderMultiplier.toFixed(2));
    }

    /**
     * @param src - [OriginalValue, NewValue, Label?]
     */
    public static dumpChangeInValue(src: [number, number, string?][]) {
        for (const index of src) {
            if (index.length === 3) {
                ItemHelpers.helpers.logger.log(`${index[2]}`, "yellow");
            }

            ItemHelpers.helpers.logger.log(
                `Change: ${index[0]} -> ${index[1]} = ${index[0] - index[1]}`,
                "yellow"
            );
        }
    }

    public static dumpDurability(src: IItem) {
        if (!ItemHelpers.isRepairable(src)) {
            ItemHelpers.helpers.logger.error(
                `Item "${ItemHelpers.helpers.itemHelper.getItemName(
                    src._tpl
                )}" does not have durability!`
            );

            return;
        }

        ItemHelpers.dumpDurabilityUPD(src.upd!.Repairable!);
    }

    public static dumpDurabilityUPD(upd: IUpdRepairable) {
        ItemHelpers.helpers.logger.log(
            `
Current Durability: ${upd.Durability}
Max Durability: ${upd.MaxDurability}
`,
            "yellow"
        );
    }

    public static dumpDurabilityChange(
        oldDurability: IUpdRepairable,
        newDurability: IUpdRepairable
    ) {
        ItemHelpers.helpers.logger.log(`Old - `, "yellow");
        ItemHelpers.dumpDurabilityUPD(oldDurability);

        ItemHelpers.helpers.logger.log(`New - `, "yellow");
        ItemHelpers.dumpDurabilityUPD(newDurability);

        ItemHelpers.helpers.logger.log(`Change - `, "yellow");

        // V - The second line is 92 characters, 1 over what I allow on wrap - V
        // prettier-ignore
        ItemHelpers.dumpChangeInValue([
            [oldDurability.Durability, newDurability.Durability, "Current Durability - "],
            [oldDurability.MaxDurability, newDurability.MaxDurability, "Max Durability - "],
        ]);
    }

    public static changeDurabiltityByPercentage(
        src: IItem,
        srcDetails: ITemplateItem,
        percentage: { min: number; max: number },
        options?: { isArmor: boolean }
    ) {
        const itemName = ItemHelpers.helpers.itemHelper.getItemName(src._tpl);

        if (!ItemHelpers.isRepairable(src)) {
            ItemHelpers.helpers.logger.error(
                `Request Dura Change for ${itemName} invalid!`
            );
            return;
        }

        const itemMaxDurability = ItemHelpers.helpers.cloner.clone(
            src.upd!.Repairable!.MaxDurability
        );
        const itemCurrentDurability = ItemHelpers.helpers.cloner.clone(
            src.upd!.Repairable!.Durability
        );
        const itemCurrentMaxDurability = ItemHelpers.helpers.cloner.clone(
            src.upd!.Repairable!.MaxDurability
        );

        const randPercentage = ItemHelpers.helpers.randomUtil.getInt(
            percentage.min,
            percentage.max
        );

        let newCurrentMaxDurability =
            itemCurrentMaxDurability - (randPercentage / 100) * itemMaxDurability;

        // Ensure new max isnt above items max
        if (newCurrentMaxDurability > itemMaxDurability) {
            newCurrentMaxDurability = itemMaxDurability;
        }

        // Then take a percentage of that
        // Take percentage of new total durability, not current
        let newCurrentDurability =
            newCurrentMaxDurability - (randPercentage / 100) * itemCurrentDurability;

        // Ensure new current isnt above items max
        if (newCurrentDurability > itemMaxDurability) {
            newCurrentDurability = itemMaxDurability;
        }

        // Update Repairable properties with new values after repair
        src.upd!.Repairable = {
            Durability: newCurrentDurability,
            MaxDurability: newCurrentMaxDurability,
        };

        // the code below generates a random degradation on the weapon durability
        const randomisedWearAmount =
            options && options.isArmor
                ? ItemHelpers.getRandomisedArmorRepairDegradationValue(
                      srcDetails._props!.ArmorMaterial!,
                      false,
                      itemCurrentMaxDurability,
                      1.0
                  )
                : ItemHelpers.getRandomisedWeaponRepairDegradationValue(
                      srcDetails._props,
                      false,
                      itemCurrentMaxDurability,
                      1.0
                  );

        // Apply wear to durability
        src.upd!.Repairable.MaxDurability -= randomisedWearAmount;

        // After adjusting max durability with degradation, ensure current dura isnt above max
        if (src.upd!.Repairable.Durability > src.upd!.Repairable.MaxDurability) {
            src.upd!.Repairable.Durability = src.upd!.Repairable.MaxDurability;
        }

        ItemHelpers.dumpChangeInValue([
            [
                itemMaxDurability,
                newCurrentMaxDurability,
                `Max Durability For: ${itemName}`,
            ],

            [
                itemCurrentDurability,
                newCurrentDurability,
                `Current Durability For: ${itemName}`,
            ],
        ]);
        ItemHelpers.helpers.logger.log("\n", "white");
    }
}
