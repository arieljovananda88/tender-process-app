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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
require("dotenv").config();
var ethers = require("ethers").ethers;
var TenderManager_json_1 = require("../../../artifacts/contracts/TenderManager.sol/TenderManager.json");
var KeyManager_json_1 = require("../../../artifacts/contracts/AccessManager.sol/AccessManager.json");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var provider, privateKey, signer, tenderManagerAddress, tenderManagerContract, keyManager, keyManagerContract, getEncryptedKey, requestAccess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
                    privateKey = process.env.PRIVATE_KEY;
                    if (!privateKey) {
                        throw new Error("❌ PRIVATE_KEY not found in environment variables");
                    }
                    signer = new ethers.Wallet(privateKey, provider);
                    tenderManagerAddress = "0xF94f0704bD710aabDE8551b6f683424a25bf4153";
                    tenderManagerContract = new ethers.Contract(tenderManagerAddress, TenderManager_json_1.default.abi, signer);
                    keyManager = "0x46A841bAbb2BB27a778e6A47Aa5bf9D4754b1738";
                    keyManagerContract = new ethers.Contract(keyManager, KeyManager_json_1.default.abi, signer);
                    return [4 /*yield*/, keyManagerContract.getEncryptedKey("Qmf4QUiXSo3Aa4Ya415xT2hz7noJRvS575SBfCLxr2uGpp", "0x3B79DcEAB0DD32F193623A5cF7b2f3F10da3A462")];
                case 1:
                    getEncryptedKey = _a.sent();
                    console.log("📌 encrypted key of '0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f':", getEncryptedKey);
                    return [4 /*yield*/, keyManagerContract.requestAccess({
                            cid: "Qmf4QUiXSo3Aa4Ya415xT2hz7noJRvS575SBfCLxr2uGpp",
                            receiver: "0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f",
                            documentName: "tender.pdf",
                            documentFormat: "pdf",
                            tenderId: "1",
                        })];
                case 2:
                    requestAccess = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return process.exit(0); })
    .catch(function (error) {
    console.log(error);
    process.exit(1);
});
