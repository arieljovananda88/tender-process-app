require("dotenv").config();
const { ethers } = require("ethers");
import tenderManagerAbi from '../../../artifacts/contracts/TenderManager.sol/TenderManager.json'
import documentStoreAbi from '../../../artifacts/contracts/DocumentStore.sol/DocumentStore.json'
import publicKeyAbi from '../../../artifacts/contracts/PublicKeyStore.sol/PublicKeyStore.json'
import keyManagerAbi from '../../../artifacts/contracts/AccessManager.sol/AccessManager.json'

async function main() {
  const  provider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
  // provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ PRIVATE_KEY not found in environment variables");
  }
  const signer = new ethers.Wallet(privateKey, provider);

  // const tenderManagerAddress = "0xF94f0704bD710aabDE8551b6f683424a25bf4153";

  // const tenderManagerContract = new ethers.Contract(
  //   tenderManagerAddress,
  //   tenderManagerAbi.abi,
  //   signer
  // );

  // const documetStore = "0x7CA4e50a67b14E84E8ABB1768a1b4eeCc26bF92b";

  // const documetStorerContract = new ethers.Contract(
  //   documetStore,
  //   documentStoreAbi.abi,
  //   signer
  // );

  const publicKeyStore = "0x8A1394421770065b5AB3a528dd029f0989A938d1"

  const publicKeyContract = new ethers.Contract(
    publicKeyStore,
    publicKeyAbi.abi,
    signer
  );

  // const keyManager = "0x46A841bAbb2BB27a778e6A47Aa5bf9D4754b1738"

  // const keyManagerContract = new ethers.Contract(
  //   keyManager,
  //   keyManagerAbi.abi,
  //   signer
  // );

  // const tenderId = ethers.utils.formatBytes32String("1");

  // console.log("📤 Calling createTender...");
  // const tx = await tenderManagerContract.createTender(tenderId);
  // await tx.wait();
  // console.log("✅ Tender created.");

  // console.log("🔍 Calling getOwner...");
  // const owner = await tenderManagerContract.getOwner(tenderId);
  // console.log("📌 Owner of tender '2':", owner);

  // const getEncryptedKey = await keyManagerContract.getEncryptedKey("Qmf4QUiXSo3Aa4Ya415xT2hz7noJRvS575SBfCLxr2uGpp", "0x3B79DcEAB0DD32F193623A5cF7b2f3F10da3A462");
  // console.log("📌 encrypted key of '0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f':", getEncryptedKey);

  // const requestAccess = await keyManagerContract.requestAccess({
  //   cid: "Qmf4QUiXSo3Aa4Ya415xT2hz7noJRvS575SBfCLxr2uGpp",
  //   receiver: "0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f",
  //   documentName: "tender.pdf",
  //   documentFormat: "pdf",
  //   tenderId: "1",
  // });

  const name = await publicKeyContract.getName("0x3B79DcEAB0DD32F193623A5cF7b2f3F10da3A462");
  console.log("📌 name of '0x3B79DcEAB0DD32F193623A5cF7b2f3F10da3A462':", name);

  // console.log("🔍 Calling getPublicKey...");
  // const publicKey = await publicKeyContract.getPublicKey("0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f");
  // console.log("📌 public key of '0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f':", publicKey);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.log(error)
    process.exit(1)
})