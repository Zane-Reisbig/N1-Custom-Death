"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConfigTypes;
(function (ConfigTypes) {
    ConfigTypes["AIRDROP"] = "spt-airdrop";
    ConfigTypes["BACKUP"] = "spt-backup";
    ConfigTypes["BOT"] = "spt-bot";
    ConfigTypes["PMC"] = "spt-pmc";
    ConfigTypes["CORE"] = "spt-core";
    ConfigTypes["HEALTH"] = "spt-health";
    ConfigTypes["HIDEOUT"] = "spt-hideout";
    ConfigTypes["HTTP"] = "spt-http";
    ConfigTypes["IN_RAID"] = "spt-inraid";
    ConfigTypes["INSURANCE"] = "spt-insurance";
    ConfigTypes["INVENTORY"] = "spt-inventory";
    ConfigTypes["ITEM"] = "spt-item";
    ConfigTypes["LOCALE"] = "spt-locale";
    ConfigTypes["LOCATION"] = "spt-location";
    ConfigTypes["LOOT"] = "spt-loot";
    ConfigTypes["MATCH"] = "spt-match";
    ConfigTypes["PLAYERSCAV"] = "spt-playerscav";
    ConfigTypes["PMC_CHAT_RESPONSE"] = "spt-pmcchatresponse";
    ConfigTypes["QUEST"] = "spt-quest";
    ConfigTypes["RAGFAIR"] = "spt-ragfair";
    ConfigTypes["REPAIR"] = "spt-repair";
    ConfigTypes["SCAVCASE"] = "spt-scavcase";
    ConfigTypes["TRADER"] = "spt-trader";
    ConfigTypes["WEATHER"] = "spt-weather";
    ConfigTypes["SEASONAL_EVENT"] = "spt-seasonalevents";
    ConfigTypes["LOST_ON_DEATH"] = "spt-lostondeath";
    ConfigTypes["GIFTS"] = "spt-gifts";
})(ConfigTypes || (ConfigTypes = {}));
class Helpers {
    logger;
    hashUtil;
    saveServer;
    timeUtil;
    randomUtil;
    profileHelper;
    databaseService;
    inRaidHelper;
    healthHelper;
    questHelper;
    rewardHelper;
    matchBotDetailsCacheService;
    pmcChatResponseService;
    playerScavGenerator;
    traderHelper;
    localisationService;
    insuranceService;
    botLootCacheService;
    configServer;
    botGenerationCacheService;
    mailSendService;
    raidTimeAdjustmentService;
    botNameService;
    lootGenerator;
    applicationContext;
    locationLootGenerator;
    pmcWaveGenerator;
    cloner;
    inRaidConfig;
    traderConfig;
    ragfairConfig;
    hideoutConfig;
    locationConfig;
    itemHelper;
    sptInventoryHelper;
    pmcConfig;
    constructor(container) {
        this.logger = container.resolve("PrimaryLogger");
        this.hashUtil = container.resolve("HashUtil");
        this.saveServer = container.resolve("SaveServer");
        this.timeUtil = container.resolve("TimeUtil");
        this.randomUtil = container.resolve("RandomUtil");
        this.profileHelper = container.resolve("ProfileHelper");
        this.databaseService = container.resolve("DatabaseService");
        this.inRaidHelper = container.resolve("InRaidHelper");
        this.healthHelper = container.resolve("HealthHelper");
        this.questHelper = container.resolve("QuestHelper");
        this.rewardHelper = container.resolve("RewardHelper");
        this.matchBotDetailsCacheService = container.resolve("MatchBotDetailsCacheService");
        this.pmcChatResponseService = container.resolve("PmcChatResponseService");
        this.playerScavGenerator =
            container.resolve("PlayerScavGenerator");
        this.traderHelper = container.resolve("TraderHelper");
        this.localisationService =
            container.resolve("LocalisationService");
        this.insuranceService = container.resolve("InsuranceService");
        this.botLootCacheService =
            container.resolve("BotLootCacheService");
        this.configServer = container.resolve("ConfigServer");
        this.botGenerationCacheService = container.resolve("BotGenerationCacheService");
        this.mailSendService = container.resolve("MailSendService");
        this.raidTimeAdjustmentService = container.resolve("RaidTimeAdjustmentService");
        this.botNameService = container.resolve("BotNameService");
        this.lootGenerator = container.resolve("LootGenerator");
        this.applicationContext =
            container.resolve("ApplicationContext");
        this.locationLootGenerator = container.resolve("LocationLootGenerator");
        this.pmcWaveGenerator = container.resolve("PmcWaveGenerator");
        this.cloner = container.resolve("PrimaryCloner");
        this.itemHelper = container.resolve("ItemHelper");
        this.sptInventoryHelper = container.resolve("InventoryHelper");
        this.inRaidConfig = this.configServer.getConfig(ConfigTypes.IN_RAID);
        this.traderConfig = this.configServer.getConfig(ConfigTypes.TRADER);
        this.ragfairConfig = this.configServer.getConfig(ConfigTypes.RAGFAIR);
        this.hideoutConfig = this.configServer.getConfig(ConfigTypes.HIDEOUT);
        this.locationConfig = this.configServer.getConfig(ConfigTypes.LOCATION);
        this.pmcConfig = this.configServer.getConfig(ConfigTypes.PMC);
    }
    static get(container) {
        return new Helpers(container);
    }
}
exports.default = Helpers;
