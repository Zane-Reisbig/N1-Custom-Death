"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ItemHelpers {
    static helpers;
    static isFoundInRaid(item) {
        return item.upd && item.upd.SpawnedInSession;
    }
    static getRandomisedArmorRepairDegradationValue(armorMaterial, isRepairKit, armorMax, traderQualityMultipler) {
        // Degradation value is based on the armor material
        const armorMaterialSettings = ItemHelpers.helpers.databaseService.getGlobals().config.ArmorMaterials[armorMaterial];
        const minMultiplier = isRepairKit
            ? armorMaterialSettings.MinRepairKitDegradation
            : armorMaterialSettings.MinRepairDegradation;
        const maxMultiplier = isRepairKit
            ? armorMaterialSettings.MaxRepairKitDegradation
            : armorMaterialSettings.MaxRepairDegradation;
        const duraLossPercent = ItemHelpers.helpers.randomUtil.getFloat(minMultiplier, maxMultiplier);
        const duraLossMultipliedByTraderMultiplier = duraLossPercent * armorMax * traderQualityMultipler;
        return Number(duraLossMultipliedByTraderMultiplier.toFixed(2));
    }
    static getRandomisedWeaponRepairDegradationValue(itemProps, isRepairKit, weaponMax, traderQualityMultipler) {
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
        const duraLossPercent = ItemHelpers.helpers.randomUtil.getFloat(minRepairDeg, maxRepairDeg);
        const duraLossMultipliedByTraderMultiplier = duraLossPercent * weaponMax * traderQualityMultipler;
        return Number(duraLossMultipliedByTraderMultiplier.toFixed(2));
    }
    static changeDurabiltityByPercentage(src, srcDetails, percentage, options) {
        if (src.upd == null || src.upd.Repairable == null) {
            ItemHelpers.helpers.logger.error(`Request Dura Change for ${ItemHelpers.helpers.itemHelper.getItemName(src._tpl)} invalid!`);
            return;
        }
        const itemMaxDurability = ItemHelpers.helpers.cloner.clone(src.upd.Repairable.MaxDurability);
        const itemCurrentDurability = ItemHelpers.helpers.cloner.clone(src.upd.Repairable.Durability);
        const itemCurrentMaxDurability = ItemHelpers.helpers.cloner.clone(src.upd.Repairable.MaxDurability);
        const randPercentage = ItemHelpers.helpers.randomUtil.getInt(percentage.min, percentage.max);
        // Same with Max Durability
        let newCurrentMaxDurability = itemCurrentMaxDurability - (randPercentage / 100) * itemMaxDurability;
        // Ensure new max isnt above items max
        if (newCurrentMaxDurability > itemMaxDurability) {
            newCurrentMaxDurability = itemMaxDurability;
        }
        // Then take a percentage of that
        // Take percentage of total durability, not current
        let newCurrentDurability = itemCurrentMaxDurability - (randPercentage / 100) * itemCurrentDurability;
        // Ensure new current isnt above items max
        if (newCurrentDurability > itemMaxDurability) {
            newCurrentDurability = itemMaxDurability;
        }
        // Update Repairable properties with new values after repair
        src.upd.Repairable = {
            Durability: newCurrentDurability,
            MaxDurability: newCurrentMaxDurability,
        };
        // the code below generates a random degradation on the weapon durability
        const randomisedWearAmount = options && options.isArmor
            ? ItemHelpers.getRandomisedArmorRepairDegradationValue(srcDetails._props.ArmorMaterial, false, itemCurrentMaxDurability, 1.0)
            : ItemHelpers.getRandomisedWeaponRepairDegradationValue(srcDetails._props, false, itemCurrentMaxDurability, 1.0);
        // Apply wear to durability
        src.upd.Repairable.MaxDurability -= randomisedWearAmount;
        // After adjusting max durability with degradation, ensure current dura isnt above max
        if (src.upd.Repairable.Durability > src.upd.Repairable.MaxDurability) {
            src.upd.Repairable.Durability = src.upd.Repairable.MaxDurability;
        }
    }
}
exports.default = ItemHelpers;
