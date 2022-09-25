console.clear();
require("dotenv").config();
const {
  AccountId,
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenInfoQuery,
  TokenType,
  CustomRoyaltyFee,
  CustomFixedFee,
  TokenSupplyType,
  TokenMintTransaction,
  TokenBurnTransaction,
  TransferTransaction,
  AccountCreateTransaction,
  AccountUpdateTransaction,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  Hbar,
} = require("@hashgraph/sdk");
//not here
console.log(process.env.OPERATOR_ID);
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const treasuryId = operatorId;
const treasuryKey = operatorKey;
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
CID = [
  "QmVV9uJYfyWQyRM4PATRxtYmWX7EeB9DNZtABFzFWgf33b",
  "QmfAwZ14jAVbQRSXuk9V1jv5cNovEDZjge71pqp7RoG5X7",
  "QmbHE4A2dATJyMUh3sJJmiQm33DyyL9Vm3iQDsgPvYteAR",
  "QmcfVR46rd42zinaFWCmJNKGpKN4bFzTrvw9ac6hkTYuKb",
  "QmfE9oNwptnLVTTJM6T5YqAcbaPKRiJxMycswyMuRRqjvQ",
];

async function main() {
  //Token Query to check if fee schedule is associated with Nft
  // var tokenInfo = await new TokenInfoQuery()
  //   .setTokenId(tokenId)
  //   .execute(client);
  // console.table(tokenInfo.customFees[0]);

  //mint multiple nfts
  nftLeaf = [];
  let nftCustomFee = await new CustomRoyaltyFee()
    .setNumerator(5)
    .setDenominator(10)
    .setFeeCollectorAccountId(treasuryId)
    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

  let nftCreate = await new TokenCreateTransaction()
    .setTokenName("Concert Tickets")
    .setTokenSymbol("TKT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(250)
    .setCustomFees([nftCustomFee])
    .setAdminKey(adminKey)
    .setSupplyKey(supplyKey)
    .freezeWith(client)
    .sign(treasuryKey);

  let nftCreateSign = await nftCreate.sign(adminKey);
  let nftCreateSubmit = await nftCreateSign.execute(client);
  let nftCreateRx = await nftCreateSubmit.getReceipt(client);
  let tokenId = nftCreateRx.tokenId;
  for (var i = 0; i < CID.length; i++) {
    nftLeaf[i] = await tokenMinterFcn(CID[i]);

    console.log(
      `Create NFT ${tokenId} with serial: ${nftLeaf[i].serials[0].low}`
    );
  }
  //console.log(nftLeaf);
  //auto associate nft with an account
  //later

  // let associateTx = await new AccountUpdateTransaction()
  //   .setAccountId() //input id
  //   .setMaxAutomaticTokenAssociations(100)
  //   .freezeWith(client)
  //   .sign(); //input key
  // let associationTxSubmit = await associateTx.execute(client);
  // let associateRx = await associateTxSubmit.getReceipt(client);
  // console.log(`User NFT Auto Association: ${associateRx.status}\n`);

  // //mint multiple nfts FUNCTION
  async function tokenMinterFcn(CID) {
    let mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(CID)])
      .freezeWith(client);
    let mintTxSign = await mintTx.sign(supplyKey);
    let mintTxSubmit = await mintTxSign.execute(client);
    mintTx = await mintTxSubmit.getReceipt(client);
    return mintTx;
  }
}
main();

//////////////
//custom concerts
//////////////

concerts = [
  {
    concert1: {
      tickets: { nftLeaf },
    },
  },
];
