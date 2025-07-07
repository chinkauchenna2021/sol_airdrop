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
var client_1 = require("@prisma/client");
var crypto_1 = require("crypto");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var configs, _i, configs_1, config, tasks, _a, tasks_1, task;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    configs = [
                        { key: 'claimsEnabled', value: true, description: 'Enable/disable claims globally' },
                        { key: 'minClaimAmount', value: 100, description: 'Minimum points required to claim' },
                        { key: 'claimRate', value: 0.001, description: 'Conversion rate from points to tokens' },
                        { key: 'pointsPerLike', value: 10, description: 'Points awarded for liking a tweet' },
                        { key: 'pointsPerRetweet', value: 20, description: 'Points awarded for retweeting' },
                        { key: 'pointsPerComment', value: 15, description: 'Points awarded for commenting' },
                        { key: 'pointsPerFollow', value: 50, description: 'Points awarded for following' },
                        { key: 'pointsPerReferral', value: 100, description: 'Points awarded for successful referral' },
                        { key: 'dailyCheckInPoints', value: 5, description: 'Points awarded for daily check-in' },
                    ];
                    _i = 0, configs_1 = configs;
                    _b.label = 1;
                case 1:
                    if (!(_i < configs_1.length)) return [3 /*break*/, 4];
                    config = configs_1[_i];
                    return [4 /*yield*/, prisma.systemConfig.upsert({
                            where: { key: config.key },
                            update: { value: config.value },
                            create: config,
                        })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
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
                    ];
                    _a = 0, tasks_1 = tasks;
                    _b.label = 5;
                case 5:
                    if (!(_a < tasks_1.length)) return [3 /*break*/, 8];
                    task = tasks_1[_a];
                    return [4 /*yield*/, prisma.task.upsert({
                            where: { id: (0, crypto_1.randomUUID)() },
                            update: {},
                            create: task,
                        })];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log('✅ Database seeded successfully');
                    return [2 /*return*/];
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
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
