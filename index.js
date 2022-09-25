require("dotenv").config();
const {
  AccountId,
  Client,
  PrivateKey,
  AccountCreateTransaction,
  AccountBalanceQuery,
  Hbar,
  TransferTransaction,
} = require("@hashgraph/sdk");

// Configure accounts and client, and generate needed keys
const myAccountId = AccountId.fromString(process.env.OPERATOR_ID);
const myPrivateKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
// const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
// const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);

const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

const supplyKey = PrivateKey.generate();
console.log("Supply Key: " + supplyKey);

async function createUser() {
  // If we weren't able to grab it, we should throw a new error
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

  //Create a new account with 1,000 tinybar starting balance
  const newAccountTransactionResponse = await new AccountCreateTransaction()
    .setKey(newAccountPublicKey)
    .setInitialBalance(Hbar.fromTinybars(1000))
    .execute(client);

  // Get the new account ID
  const getReceipt = await newAccountTransactionResponse.getReceipt(client);
  const newAccountId = getReceipt.accountId;

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

createUser().then((response) => {
  userId = "0.0." + response.newAccountId.num.low;
  console.log(userId);
});

// async function generateNFT() {
//   let nftCustomFee = await new CustomRoyaltyFee()
//     .setNumberator(1)
//     .setDenominatior(10)
//     .setCollectorAccountId(treasurryId)
//     .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

//   let nftCreate = await new TokenCreateTransaction()
//     .setTokenName("Taylor Swift")
//     .setTokenSymbol("TAYSFT")
//     .setTokenType(TokenType.NonFungibleUnique)
//     .setDecimals(0)
//     .setInitialSupply(0)
//     .setTreasuryAccountId(treasuryId)
//     .setSupplyType(TokenSupplyType.Finite)
//     .setMaxSuply(100)
//     .setCustomFees([nftCustomFee])
//     .setAdminKey(supplyKey)
//     .setSupplyType(supplyKey)
//     .freezeWith(client)
//     .sign(treasuryKey);

//   let nftCreateSign = await nftCreate.sign(adminKey);
//   let nftCreateSubmit = await nftCreateSign.execute(client);
//   let nftCreateRx = await nftCreateRx.tokenId;
//   console.log(`Created NFT with Token ID: ${tokenId}`);
// }
