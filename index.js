console.clear();
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
// const {
//   default: MirrorChannel,
// } = require("@hashgraph/sdk/lib/channel/MirrorChannel");

require("dotenv").config();
// Configure accounts and client, and generate needed keys
const myAccountId = AccountId.fromString(process.env.OPERATOR_ID);
const myPrivateKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);

const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
console.log("Supply Key: " + supplyKey);

async function createUser() {
  //If we weren't able to grab it, we should throw a new error
  if (myAccountId == null || myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }

  // Create our connection to the Hedera network
  // The Hedera JS SDK makes this really easy!
  const client = Client.forTestnet();

  client.setOperator(myAccountId, myPrivateKey);

  //Create new keys
  const newAccountPrivateKey = await PrivateKey.generateED25519();
  const newAccountPublicKey = newAccountPrivateKey.publicKey;

  const treasuryKey = newAccountPrivateKey;
  //Create a new account with 1,000 tinybar starting balance
  const newAccountTransactionResponse = await new AccountCreateTransaction()
    .setKey(newAccountPublicKey)
    .setInitialBalance(Hbar.fromTinybars(1000))
    .execute(client);

  // Get the new account ID
  const getReceipt = await newAccountTransactionResponse.getReceipt(client);
  const newAccountId = getReceipt.accountId;
  const treasuryId = newAccountId;
  console.log("The new account ID is: " + newAccountId);

  //Verify the account balance
  const accountBalance = await new AccountBalanceQuery()
    .setAccountId(newAccountId)
    .execute(client);

  console.log(
    "The new account balance is: " +
      accountBalance.hbars.toTinybars() +
      " tinybar."
  );

  //Create the transfer transaction
  const sendHbar = await new TransferTransaction()
    .addHbarTransfer(myAccountId, Hbar.fromTinybars(-1000))
    .addHbarTransfer(newAccountId, Hbar.fromTinybars(1000))
    .execute(client);

  //Verify the transaction reached consensus
  const transactionReceipt = await sendHbar.getReceipt(client);
  console.log(
    "The transfer transaction from my account to the new account was: " +
      transactionReceipt.status.toString()
  );

  //Request the cost of the query
  const queryCost = await new AccountBalanceQuery()
    .setAccountId(newAccountId)
    .getCost(client);

  console.log("The cost of query is: " + queryCost);

  //Check the new account's balance
  const getNewBalance = await new AccountBalanceQuery()
    .setAccountId(newAccountId)
    .execute(client);

  console.log(
    "The account balance after the transfer is: " +
      getNewBalance.hbars.toTinybars() +
      " tinybar."
  );

  return {
    newAccountPrivateKey: newAccountPrivateKey,
    newAccountId: newAccountId,
  };
}

(async () => {
  let data = await createUser();
  console.log(
    data.newAccountId,
    data.newAccountPrivateKey,
    data.adminKey,
    data.supplyKey
  );
  generateNFT(
    data.newAccountId,
    data.newAccountPrivateKey,
    data.adminKey,
    data.supplyKey
  );
})();

async function generateNFT(treasuryId, treasuryKey, adminKey, supplyKey) {
  let nftCustomFee = await new CustomRoyaltyFee()
    .setNumerator(1)
    .setDenominator(10)
    .setFeeCollectorAccountId(treasuryId)
    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

  let nftCreate = await new TokenCreateTransaction()
    .setTokenName("Taylor Swift")
    .setTokenSymbol("TAYSFT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(100)
    .setCustomFees([nftCustomFee])
    .setAdminKey(adminKey)
    .setSupplyType(supplyKey)
    .freezeWith(client)
    .sign(treasuryKey);

  let nftCreateSign = await nftCreate.sign(adminKey);
  let nftCreateSubmit = await nftCreateSign.execute(client);
  let nftCreateRx = await nftCreateRx.tokenId;
  console.log(`Created NFT with Token ID: ${tokenId}`);
}
