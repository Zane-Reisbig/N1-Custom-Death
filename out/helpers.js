"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("./enums");
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
        this.inRaidConfig = this.configServer.getConfig(enums_1.ConfigTypes.IN_RAID);
        this.traderConfig = this.configServer.getConfig(enums_1.ConfigTypes.TRADER);
        this.ragfairConfig = this.configServer.getConfig(enums_1.ConfigTypes.RAGFAIR);
        this.hideoutConfig = this.configServer.getConfig(enums_1.ConfigTypes.HIDEOUT);
        this.locationConfig = this.configServer.getConfig(enums_1.ConfigTypes.LOCATION);
        this.pmcConfig = this.configServer.getConfig(enums_1.ConfigTypes.PMC);
    }
    static get(container) {
        return new Helpers(container);
    }
}
exports.default = Helpers;
