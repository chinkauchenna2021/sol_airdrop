"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts - REPLACE your existing seed file with this
var prisma_1 = require("../src/lib/prisma");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var configs, _i, configs_1, config, existingTasks, tasks, _a, tasks_1, task, error_1, existingAchievements, achievements, _b, achievements_1, achievement, error_2, existingDemoUser, demoUsers, _c, demoUsers_1, user, error_3, _d, configCount, taskCount, error_4;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 30, , 31]);
                    configs = [
                        // Existing configs
                        { key: 'claimsEnabled', value: true, description: 'Enable/disable claims globally' },
                        { key: 'minClaimAmount', value: 100, description: 'Minimum points required to claim' },
                        { key: 'claimRate', value: 0.001, description: 'Conversion rate from points to tokens' },
                        { key: 'pointsPerLike', value: 10, description: 'Points awarded for liking a tweet' },
                        { key: 'pointsPerRetweet', value: 20, description: 'Points awarded for retweeting' },
                        { key: 'pointsPerComment', value: 15, description: 'Points awarded for commenting' },
                        { key: 'pointsPerFollow', value: 50, description: 'Points awarded for following' },
                        { key: 'pointsPerReferral', value: 100, description: 'Points awarded for successful referral' },
                        { key: 'dailyCheckInPoints', value: 5, description: 'Points awarded for daily check-in' },
                        // NEW: Activity-based token allocation configs (your main requirement)
                        { key: 'highActivityTokens', value: 4000, description: 'Tokens for high activity users (1000+ followers)' },
                        { key: 'mediumActivityTokens', value: 3500, description: 'Tokens for medium activity users (500+ followers)' },
                        { key: 'lowActivityTokens', value: 3000, description: 'Tokens for low activity users' },
                        // NEW: Activity thresholds
                        { key: 'highActivityThreshold', value: 1000, description: 'Follower count for high activity' },
                        { key: 'mediumActivityThreshold', value: 500, description: 'Follower count for medium activity' },
                        // NEW: Platform settings
                        { key: 'maintenanceMode', value: false, description: 'Enable maintenance mode' },
                        { key: 'registrationEnabled', value: true, description: 'Allow new user registration' },
                        { key: 'twitterTrackingEnabled', value: true, description: 'Enable Twitter tracking' },
                        { key: 'airdropEnabled', value: true, description: 'Enable airdrop functionality' },
                    ];
                    console.log('📝 Creating/updating system configurations...');
                    _i = 0, configs_1 = configs;
                    _e.label = 2;
                case 2:
                    if (!(_i < configs_1.length)) return [3 /*break*/, 5];
                    config = configs_1[_i];
                    return [4 /*yield*/, prisma_1.default.systemConfig.upsert({
                            where: { key: config.key },
                            update: {
                                value: config.value,
                                description: config.description
                            },
                            create: {
                                key: config.key,
                                value: config.value,
                                description: config.description
                            },
                        })];
                case 3:
                    _e.sent();
                    _e.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, prisma_1.default.task.findMany()];
                case 6:
                    existingTasks = _e.sent();
                    if (!(existingTasks.length === 0)) return [3 /*break*/, 13];
                    console.log('🎯 Creating default tasks...');
                    tasks = [
                        {
                            name: 'Follow on Twitter',
                            description: 'Follow our official Twitter account',
                            type: 'SOCIAL_TWITTER',
                            points: 50,
                            requirements: { action: 'follow', targetId: '@SolanaAirdrop' },
                        },
                        {
                            name: 'Daily Check-in',
                            description: 'Visit the platform daily to earn points',
                            type: 'DAILY_CHECK_IN',
                            points: 5,
                            requirements: { frequency: 'daily' },
                        },
                        {
                            name: 'Connect Wallet',
                            description: 'Connect your Solana wallet to the platform',
                            type: 'WALLET_CONNECT',
                            points: 25,
                            requirements: { action: 'connect' },
                        },
                        {
                            name: 'Refer a Friend',
                            description: 'Invite friends to join the platform',
                            type: 'REFERRAL',
                            points: 100,
                            requirements: { action: 'refer', minReferrals: 1 },
                        },
                        // NEW: Enhanced Twitter tasks
                        {
                            name: 'Like Announcement Tweet',
                            description: 'Like our platform announcement',
                            type: 'SOCIAL_TWITTER',
                            points: 10,
                            requirements: { action: 'like', tweetId: 'announcement_tweet' },
                        },
                        {
                            name: 'Retweet with Comment',
                            description: 'Retweet our announcement with your thoughts',
                            type: 'SOCIAL_TWITTER',
                            points: 25,
                            requirements: { action: 'retweet', tweetId: 'announcement_tweet', requireComment: true },
                        },
                    ];
                    _a = 0, tasks_1 = tasks;
                    _e.label = 7;
                case 7:
                    if (!(_a < tasks_1.length)) return [3 /*break*/, 12];
                    task = tasks_1[_a];
                    _e.label = 8;
                case 8:
                    _e.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, prisma_1.default.task.create({
                            data: task,
                        })];
                case 9:
                    _e.sent();
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _e.sent();
                    console.log("Task \"".concat(task.name, "\" might already exist, skipping..."));
                    return [3 /*break*/, 11];
                case 11:
                    _a++;
                    return [3 /*break*/, 7];
                case 12: return [3 /*break*/, 14];
                case 13:
                    console.log("\u2705 Found ".concat(existingTasks.length, " existing tasks, skipping task creation"));
                    _e.label = 14;
                case 14:
                    _e.trys.push([14, 20, , 21]);
                    return [4 /*yield*/, prisma_1.default.achievement.findMany()];
                case 15:
                    existingAchievements = _e.sent();
                    if (!(existingAchievements.length === 0)) return [3 /*break*/, 19];
                    console.log('🏆 Creating achievements...');
                    achievements = [
                        {
                            name: 'First Steps',
                            description: 'Complete your first task',
                            icon: '👋',
                            requirements: { tasksCompleted: 1 },
                            points: 25,
                        },
                        {
                            name: 'Twitter Pioneer',
                            description: 'Connect your Twitter account',
                            icon: '🐦',
                            requirements: { twitterConnected: true },
                            points: 50,
                        },
                        {
                            name: 'Point Collector',
                            description: 'Earn your first 100 points',
                            icon: '💎',
                            requirements: { totalPoints: 100 },
                            points: 50,
                        },
                        {
                            name: 'Social Butterfly',
                            description: 'Complete 10 Twitter engagements',
                            icon: '🦋',
                            requirements: { twitterEngagements: 10 },
                            points: 100,
                        },
                        {
                            name: 'Streak Master',
                            description: 'Maintain a 7-day check-in streak',
                            icon: '🔥',
                            requirements: { checkInStreak: 7 },
                            points: 150,
                        },
                        {
                            name: 'High Activity User',
                            description: 'Achieve high activity status (1000+ followers)',
                            icon: '⭐',
                            requirements: { twitterFollowers: 1000 },
                            points: 500,
                            isSecret: true,
                        },
                    ];
                    _b = 0, achievements_1 = achievements;
                    _e.label = 16;
                case 16:
                    if (!(_b < achievements_1.length)) return [3 /*break*/, 19];
                    achievement = achievements_1[_b];
                    return [4 /*yield*/, prisma_1.default.achievement.create({
                            data: achievement,
                        })];
                case 17:
                    _e.sent();
                    _e.label = 18;
                case 18:
                    _b++;
                    return [3 /*break*/, 16];
                case 19: return [3 /*break*/, 21];
                case 20:
                    error_2 = _e.sent();
                    console.log('Achievement table not found, skipping achievements creation');
                    return [3 /*break*/, 21];
                case 21:
                    if (!(process.env.NODE_ENV === 'development')) return [3 /*break*/, 28];
                    console.log('👤 Creating demo users for testing...');
                    return [4 /*yield*/, prisma_1.default.user.findFirst({
                            where: { walletAddress: { contains: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' } }
                        })];
                case 22:
                    existingDemoUser = _e.sent();
                    if (!!existingDemoUser) return [3 /*break*/, 28];
                    demoUsers = [
                        {
                            walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                            isAdmin: true,
                            totalPoints: 1500,
                            level: 2,
                            twitterUsername: 'demo_admin',
                            twitterFollowers: 1500,
                            twitterActivity: 'HIGH',
                        },
                        {
                            walletAddress: '8VzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWN',
                            totalPoints: 750,
                            level: 1,
                            twitterUsername: 'demo_user_medium',
                            twitterFollowers: 750,
                            twitterActivity: 'MEDIUM',
                        },
                        {
                            walletAddress: '7UzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWO',
                            totalPoints: 300,
                            level: 1,
                            twitterUsername: 'demo_user_low',
                            twitterFollowers: 300,
                            twitterActivity: 'LOW',
                        },
                    ];
                    _c = 0, demoUsers_1 = demoUsers;
                    _e.label = 23;
                case 23:
                    if (!(_c < demoUsers_1.length)) return [3 /*break*/, 28];
                    user = demoUsers_1[_c];
                    _e.label = 24;
                case 24:
                    _e.trys.push([24, 26, , 27]);
                    return [4 /*yield*/, prisma_1.default.user.create({
                            data: user,
                        })];
                case 25:
                    _e.sent();
                    return [3 /*break*/, 27];
                case 26:
                    error_3 = _e.sent();
                    console.log("Demo user already exists, skipping...");
                    return [3 /*break*/, 27];
                case 27:
                    _c++;
                    return [3 /*break*/, 23];
                case 28:
                    console.log('✅ Database seeded successfully!');
                    return [4 /*yield*/, Promise.all([
                            prisma_1.default.systemConfig.count(),
                            prisma_1.default.task.count(),
                        ])];
                case 29:
                    _d = _e.sent(), configCount = _d[0], taskCount = _d[1];
                    console.log('📊 Summary:');
                    console.log("   - ".concat(configCount, " system configurations"));
                    console.log("   - ".concat(taskCount, " tasks"));
                    console.log('   - Activity-based token allocation: HIGH(4000) | MEDIUM(3500) | LOW(3000)');
                    return [3 /*break*/, 31];
                case 30:
                    error_4 = _e.sent();
                    console.error('❌ Seed error:', error_4);
                    throw error_4;
                case 31: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
