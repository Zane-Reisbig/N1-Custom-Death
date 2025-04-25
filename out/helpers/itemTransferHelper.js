"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TransferTypes;
(function (TransferTypes) {
    TransferTypes["BTR"] = "btr";
    TransferTypes["TRANSIT"] = "transit";
})(TransferTypes || (TransferTypes = {}));
var Traders;
(function (Traders) {
    Traders["PRAPOR"] = "54cb50c76803fa8b248b4571";
    Traders["THERAPIST"] = "54cb57776803fa99248b456e";
    Traders["FENCE"] = "579dc571d53a0658a154fbec";
    Traders["SKIER"] = "58330581ace78e27b8b10cee";
    Traders["PEACEKEEPER"] = "5935c25fb3acc3127c3d8cd9";
    Traders["MECHANIC"] = "5a7c2eca46aef81a7ca2145d";
    Traders["RAGMAN"] = "5ac3b934156ae10c4430e83c";
    Traders["JAEGER"] = "5c0647fdd443bc2504c2d371";
    Traders["LIGHTHOUSEKEEPER"] = "638f541a29ffd1183d187f57";
    Traders["BTR"] = "656f0f98d80a697f855d34b1";
    Traders["REF"] = "6617beeaa9cfa777ca915b7c";
})(Traders || (Traders = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["USER_MESSAGE"] = 1] = "USER_MESSAGE";
    MessageType[MessageType["NPC_TRADER"] = 2] = "NPC_TRADER";
    MessageType[MessageType["AUCTION_MESSAGE"] = 3] = "AUCTION_MESSAGE";
    MessageType[MessageType["FLEAMARKET_MESSAGE"] = 4] = "FLEAMARKET_MESSAGE";
    MessageType[MessageType["ADMIN_MESSAGE"] = 5] = "ADMIN_MESSAGE";
    MessageType[MessageType["GROUP_CHAT_MESSAGE"] = 6] = "GROUP_CHAT_MESSAGE";
    MessageType[MessageType["SYSTEM_MESSAGE"] = 7] = "SYSTEM_MESSAGE";
    MessageType[MessageType["INSURANCE_RETURN"] = 8] = "INSURANCE_RETURN";
    MessageType[MessageType["GLOBAL_CHAT"] = 9] = "GLOBAL_CHAT";
    MessageType[MessageType["QUEST_START"] = 10] = "QUEST_START";
    MessageType[MessageType["QUEST_FAIL"] = 11] = "QUEST_FAIL";
    MessageType[MessageType["QUEST_SUCCESS"] = 12] = "QUEST_SUCCESS";
    MessageType[MessageType["MESSAGE_WITH_ITEMS"] = 13] = "MESSAGE_WITH_ITEMS";
    MessageType[MessageType["INITIAL_SUPPORT"] = 14] = "INITIAL_SUPPORT";
    MessageType[MessageType["BTR_ITEMS_DELIVERY"] = 15] = "BTR_ITEMS_DELIVERY";
})(MessageType || (MessageType = {}));
class ItemTransferHelper {
    static helpers;
    static checkBTRTransfer(details) {
        for (const transferType of [TransferTypes.BTR, TransferTypes.TRANSIT]) {
            const rootID = `${Traders.BTR}_${transferType}`;
            const itemsToSend = (details.request.transferItems[rootID] || []).filter(
            // Remove the BTR Container Item from the list before delivering
            (item) => item._id !== Traders.BTR);
            if (itemsToSend.length === 0)
                continue;
            ItemTransferHelper.scheduleItemDelivery(details, Traders.BTR, itemsToSend);
        }
    }
    static scheduleItemDelivery(details, traderID, items) {
        const serverProfile = ItemTransferHelper.helpers.saveServer.getProfile(details.sessionId);
        const pmcData = serverProfile.characters.pmc;
        const dialogueTemplates = ItemTransferHelper.helpers.databaseService.getTrader(traderID).dialogue;
        if (dialogueTemplates == null) {
            ItemTransferHelper.helpers.logger.error("No Trader dialogue found");
            return;
        }
        const messageID = ItemTransferHelper.helpers.randomUtil.getArrayValue(dialogueTemplates["itemsDelivered"]);
        const messageStoreTime = ItemTransferHelper.helpers.timeUtil.getHoursAsSeconds(ItemTransferHelper.helpers.traderConfig.fence.btrDeliveryExpireHours);
        // Remove any items that were returned by the item delivery, but also insured, from the player's insurance list
        // This is to stop items being duplicated by being returned from both item delivery and insurance
        const deliveredItemIds = items.map((item) => item._id);
        pmcData.InsuredItems = pmcData.InsuredItems.filter((insuredItem) => !deliveredItemIds.includes(insuredItem.itemId));
        // Send the items to the player
        ItemTransferHelper.helpers.mailSendService.sendLocalisedNpcMessageToPlayer(details.sessionId, ItemTransferHelper.helpers.traderHelper.getTraderById(traderID), MessageType.BTR_ITEMS_DELIVERY, messageID, items, messageStoreTime);
    }
}
exports.default = ItemTransferHelper;
