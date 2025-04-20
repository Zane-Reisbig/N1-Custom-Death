import { LocationLifecycleService } from "@spt/services/LocationLifecycleService";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { SaveServer } from "@spt/servers/SaveServer";
import { IPreSptLoadModAsync } from "@spt/models/external/IPreSptLoadModAsync";
import { HashUtil } from "@spt/utils/HashUtil";
import { TimeUtil } from "@spt/utils/TimeUtil";
import { IEndLocalRaidRequestData } from "@spt/models/eft/match/IEndLocalRaidRequestData";
import { RandomUtil } from "@spt/utils/RandomUtil";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";
import { InRaidHelper } from "@spt/helpers/InRaidHelper";
import { HealthHelper } from "@spt/helpers/HealthHelper";
import { QuestHelper } from "@spt/helpers/QuestHelper";
import { RewardHelper } from "@spt/helpers/RewardHelper";
import { MatchBotDetailsCacheService } from "@spt/services/MatchBotDetailsCacheService";
import { PmcChatResponseService } from "@spt/services/PmcChatResponseService";
import { PlayerScavGenerator } from "@spt/generators/PlayerScavGenerator";
import { TraderHelper } from "@spt/helpers/TraderHelper";
import { LocalisationService } from "@spt/services/LocalisationService";
import { InsuranceService } from "@spt/services/InsuranceService";
import { BotLootCacheService } from "@spt/services/BotLootCacheService";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { BotGenerationCacheService } from "@spt/services/BotGenerationCacheService";
import { MailSendService } from "@spt/services/MailSendService";
import { RaidTimeAdjustmentService } from "@spt/services/RaidTimeAdjustmentService";
import { BotNameService } from "@spt/services/BotNameService";
import { LootGenerator } from "@spt/generators/LootGenerator";
import { ApplicationContext } from "@spt/context/ApplicationContext";
import { LocationLootGenerator } from "@spt/generators/LocationLootGenerator";
import { PmcWaveGenerator } from "@spt/generators/PmcWaveGenerator";
import { ICloner } from "@spt/utils/cloners/ICloner";
import { DatabaseService } from "@spt/services/DatabaseService";
import { IInRaidConfig } from "@spt/models/spt/config/IInRaidConfig";
import { ITraderConfig } from "@spt/models/spt/config/ITraderConfig";
import { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import { IHideoutConfig } from "@spt/models/spt/config/IHideoutConfig";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig";
import { IItem } from "@spt/models/eft/common/tables/IItem";
import { ILocation } from "@spt/models/eft/common/ILocation";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IQuestStatus, ITraderInfo } from "@spt/models/eft/common/tables/IBotBase";
import { ISptProfile } from "@spt/models/eft/profile/ISptProfile";
import { DependencyContainer } from "tsyringe";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { InventoryHelper } from "@spt/helpers/InventoryHelper";

enum ConfigTypes {
    AIRDROP = "spt-airdrop",
    BACKUP = "spt-backup",
    BOT = "spt-bot",
    PMC = "spt-pmc",
    CORE = "spt-core",
    HEALTH = "spt-health",
    HIDEOUT = "spt-hideout",
    HTTP = "spt-http",
    IN_RAID = "spt-inraid",
    INSURANCE = "spt-insurance",
    INVENTORY = "spt-inventory",
    ITEM = "spt-item",
    LOCALE = "spt-locale",
    LOCATION = "spt-location",
    LOOT = "spt-loot",
    MATCH = "spt-match",
    PLAYERSCAV = "spt-playerscav",
    PMC_CHAT_RESPONSE = "spt-pmcchatresponse",
    QUEST = "spt-quest",
    RAGFAIR = "spt-ragfair",
    REPAIR = "spt-repair",
    SCAVCASE = "spt-scavcase",
    TRADER = "spt-trader",
    WEATHER = "spt-weather",
    SEASONAL_EVENT = "spt-seasonalevents",
    LOST_ON_DEATH = "spt-lostondeath",
    GIFTS = "spt-gifts",
}

export default class Helpers {
    logger: ILogger;
    hashUtil: HashUtil;
    saveServer: SaveServer;
    timeUtil: TimeUtil;
    randomUtil: RandomUtil;
    profileHelper: ProfileHelper;
    databaseService: DatabaseService;
    inRaidHelper: InRaidHelper;
    healthHelper: HealthHelper;
    questHelper: QuestHelper;
    rewardHelper: RewardHelper;
    matchBotDetailsCacheService: MatchBotDetailsCacheService;
    pmcChatResponseService: PmcChatResponseService;
    playerScavGenerator: PlayerScavGenerator;
    traderHelper: TraderHelper;
    localisationService: LocalisationService;
    insuranceService: InsuranceService;
    botLootCacheService: BotLootCacheService;
    configServer: ConfigServer;
    botGenerationCacheService: BotGenerationCacheService;
    mailSendService: MailSendService;
    raidTimeAdjustmentService: RaidTimeAdjustmentService;
    botNameService: BotNameService;
    lootGenerator: LootGenerator;
    applicationContext: ApplicationContext;
    locationLootGenerator: LocationLootGenerator;
    pmcWaveGenerator: PmcWaveGenerator;
    cloner: ICloner;
    inRaidConfig: IInRaidConfig;
    traderConfig: ITraderConfig;
    ragfairConfig: IRagfairConfig;
    hideoutConfig: IHideoutConfig;
    locationConfig: ILocationConfig;
    itemHelper: ItemHelper;
    sptInventoryHelper: InventoryHelper;
    pmcConfig: IPmcConfig;

    private constructor(container: DependencyContainer) {
        this.logger = container.resolve<ILogger>("PrimaryLogger");
        this.hashUtil = container.resolve<HashUtil>("HashUtil");
        this.saveServer = container.resolve<SaveServer>("SaveServer");
        this.timeUtil = container.resolve<TimeUtil>("TimeUtil");
        this.randomUtil = container.resolve<RandomUtil>("RandomUtil");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        this.databaseService = container.resolve<DatabaseService>("DatabaseService");
        this.inRaidHelper = container.resolve<InRaidHelper>("InRaidHelper");
        this.healthHelper = container.resolve<HealthHelper>("HealthHelper");
        this.questHelper = container.resolve<QuestHelper>("QuestHelper");
        this.rewardHelper = container.resolve<RewardHelper>("RewardHelper");
        this.matchBotDetailsCacheService = container.resolve<MatchBotDetailsCacheService>(
            "MatchBotDetailsCacheService"
        );
        this.pmcChatResponseService = container.resolve<PmcChatResponseService>(
            "PmcChatResponseService"
        );
        this.playerScavGenerator =
            container.resolve<PlayerScavGenerator>("PlayerScavGenerator");
        this.traderHelper = container.resolve<TraderHelper>("TraderHelper");
        this.localisationService =
            container.resolve<LocalisationService>("LocalisationService");
        this.insuranceService = container.resolve<InsuranceService>("InsuranceService");
        this.botLootCacheService =
            container.resolve<BotLootCacheService>("BotLootCacheService");
        this.configServer = container.resolve<ConfigServer>("ConfigServer");
        this.botGenerationCacheService = container.resolve<BotGenerationCacheService>(
            "BotGenerationCacheService"
        );
        this.mailSendService = container.resolve<MailSendService>("MailSendService");
        this.raidTimeAdjustmentService = container.resolve<RaidTimeAdjustmentService>(
            "RaidTimeAdjustmentService"
        );
        this.botNameService = container.resolve<BotNameService>("BotNameService");
        this.lootGenerator = container.resolve<LootGenerator>("LootGenerator");
        this.applicationContext =
            container.resolve<ApplicationContext>("ApplicationContext");
        this.locationLootGenerator = container.resolve<LocationLootGenerator>(
            "LocationLootGenerator"
        );
        this.pmcWaveGenerator = container.resolve<PmcWaveGenerator>("PmcWaveGenerator");
        this.cloner = container.resolve<ICloner>("PrimaryCloner");
        this.itemHelper = container.resolve<ItemHelper>("ItemHelper");
        this.sptInventoryHelper = container.resolve<InventoryHelper>("InventoryHelper");

        this.inRaidConfig = this.configServer.getConfig(ConfigTypes.IN_RAID);
        this.traderConfig = this.configServer.getConfig(ConfigTypes.TRADER);
        this.ragfairConfig = this.configServer.getConfig(ConfigTypes.RAGFAIR);
        this.hideoutConfig = this.configServer.getConfig(ConfigTypes.HIDEOUT);
        this.locationConfig = this.configServer.getConfig(ConfigTypes.LOCATION);
        this.pmcConfig = this.configServer.getConfig(ConfigTypes.PMC);
    }

    public static get(container: DependencyContainer) {
        return new Helpers(container);
    }
}
