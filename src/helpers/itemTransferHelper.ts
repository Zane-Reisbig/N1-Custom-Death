import Helpers from "./helpers";
import { SessionDetails } from "../originalEndRaid";

import { IItem } from "@spt/models/eft/common/tables/IItem";

enum TransferTypes {
    BTR = "btr",
    TRANSIT = "transit",
}

enum Traders {
    PRAPOR = "54cb50c76803fa8b248b4571",
    THERAPIST = "54cb57776803fa99248b456e",
    FENCE = "579dc571d53a0658a154fbec",
    SKIER = "58330581ace78e27b8b10cee",
    PEACEKEEPER = "5935c25fb3acc3127c3d8cd9",
    MECHANIC = "5a7c2eca46aef81a7ca2145d",
    RAGMAN = "5ac3b934156ae10c4430e83c",
    JAEGER = "5c0647fdd443bc2504c2d371",
    LIGHTHOUSEKEEPER = "638f541a29ffd1183d187f57",
    BTR = "656f0f98d80a697f855d34b1",
    REF = "6617beeaa9cfa777ca915b7c",
}

enum MessageType {
    USER_MESSAGE = 1,
    NPC_TRADER = 2,
    AUCTION_MESSAGE = 3,
    FLEAMARKET_MESSAGE = 4,
    ADMIN_MESSAGE = 5,
    GROUP_CHAT_MESSAGE = 6,
    SYSTEM_MESSAGE = 7,
    INSURANCE_RETURN = 8,
    GLOBAL_CHAT = 9,
    QUEST_START = 10,
    QUEST_FAIL = 11,
    QUEST_SUCCESS = 12,
    MESSAGE_WITH_ITEMS = 13,
    INITIAL_SUPPORT = 14,
    BTR_ITEMS_DELIVERY = 15,
}

export default class ItemTransferHelper {
    static helpers: Helpers;

    static checkBTRTransfer(details: SessionDetails) {
        for (const transferType of [TransferTypes.BTR, TransferTypes.TRANSIT]) {
            const rootID = `${Traders.BTR}_${transferType}`;

            const itemsToSend = (details.request.transferItems[rootID] || []).filter(
                // Remove the BTR Container Item from the list before delivering
                (item) => item._id !== Traders.BTR
            );

            if (itemsToSend.length === 0) continue;

            ItemTransferHelper.scheduleItemDelivery(details, Traders.BTR, itemsToSend);
        }
    }

    static scheduleItemDelivery(
        details: SessionDetails,
        traderID: Traders,
        items: IItem[]
    ) {
        const serverProfile = ItemTransferHelper.helpers.saveServer.getProfile(
            details.sessionId
        );

        const pmcData = serverProfile.characters.pmc;
        const dialogueTemplates =
            ItemTransferHelper.helpers.databaseService.getTrader(traderID).dialogue;

        if (dialogueTemplates == null) {
            ItemTransferHelper.helpers.logger.error("No Trader dialogue found");
            return;
        }

        const messageID = ItemTransferHelper.helpers.randomUtil.getArrayValue(
            dialogueTemplates["itemsDelivered"]
        );

        const messageStoreTime = ItemTransferHelper.helpers.timeUtil.getHoursAsSeconds(
            ItemTransferHelper.helpers.traderConfig.fence.btrDeliveryExpireHours
        );

        // Remove any items that were returned by the item delivery, but also insured, from the player's insurance list
        // This is to stop items being duplicated by being returned from both item delivery and insurance
        const deliveredItemIds = items.map((item) => item._id);
        pmcData.InsuredItems = pmcData.InsuredItems.filter(
            (insuredItem) => !deliveredItemIds.includes(insuredItem.itemId)
        );

        // Send the items to the player
        ItemTransferHelper.helpers.mailSendService.sendLocalisedNpcMessageToPlayer(
            details.sessionId,
            ItemTransferHelper.helpers.traderHelper.getTraderById(traderID)!,
            MessageType.BTR_ITEMS_DELIVERY,
            messageID,
            items,
            messageStoreTime
        );
    }
}
