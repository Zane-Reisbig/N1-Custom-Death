import { ConfigTypes } from "../Definitions/enums";

import { ILogger } from "@spt/models/spt/utils/ILogger";
import { SaveServer } from "@spt/servers/SaveServer";
import { HashUtil } from "@spt/utils/HashUtil";
import { TimeUtil } from "@spt/utils/TimeUtil";
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
import { DependencyContainer } from "tsyringe";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { InventoryHelper } from "@spt/helpers/InventoryHelper";
import { BotGenerator } from "@spt/generators/BotGenerator";
import { BotGeneratorHelper } from "@spt/helpers/BotGeneratorHelper";
import { BotHelper } from "@spt/helpers/BotHelper";
import { FenceService } from "@spt/services/FenceService";

export default class Helpers {
    private static self: Helpers;

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
    botHelper: BotHelper;
    botGenerator: BotGenerator;
    botGeneratorHelper: BotGeneratorHelper;
    pmcConfig: IPmcConfig;
    fenceService: FenceService;

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
        this.botHelper = container.resolve<BotHelper>("BotHelper");
        this.botGenerator = container.resolve<BotGenerator>("BotGenerator");
        this.botGeneratorHelper =
            container.resolve<BotGeneratorHelper>("BotGeneratorHelper");

        this.inRaidConfig = this.configServer.getConfig(ConfigTypes.IN_RAID);
        this.traderConfig = this.configServer.getConfig(ConfigTypes.TRADER);
        this.ragfairConfig = this.configServer.getConfig(ConfigTypes.RAGFAIR);
        this.hideoutConfig = this.configServer.getConfig(ConfigTypes.HIDEOUT);
        this.locationConfig = this.configServer.getConfig(ConfigTypes.LOCATION);
        this.pmcConfig = this.configServer.getConfig(ConfigTypes.PMC);
        this.fenceService = container.resolve<FenceService>("FenceService");
    }

    public static get(container: DependencyContainer) {
        if (Helpers.self == null) {
            Helpers.self = new Helpers(container);
        }

        return Helpers.self;
    }

    public static randInt(range: { min: number; max: number }) {
        return Helpers.self.randomUtil.randInt(range.min, range.max + 1);
    }

    public static randFloat(range: { min: number; max: number }) {
        return Helpers.self.randomUtil.getFloat(range.min, range.max + 1);
    }

    public static getRandomPercentage(src: number, range: { min: number; max: number }) {
        return Helpers.randFloat(range) * src;
    }
}
