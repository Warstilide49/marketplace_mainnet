const nft_contract = 'dev-1654158872994-43526873072091' //''dev-1653362742618-42287399483761' //'dev-1652185815615-38783641891685' //'royalties.evin.testnet' //'dev-1646240406152-71422260461975'

const marketplace_contract= 'dev-1653811534834-97919957626619' //'dev-1653363544091-47600905380994' //'dev-1652450363200-32566891032927' //'dev-1651817325992-49412045689708' //'auction_market.evin.testnet' 

function getConfig(env) {
  switch (env) {

  case 'production':
  case 'mainnet':
    return {
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      nftContract: nft_contract,
      marketplaceContract: marketplace_contract,
      walletUrl: 'https://wallet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
    }
  case 'development':
  case 'testnet':
    return {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      nftContract: nft_contract,
      marketplaceContract: marketplace_contract,
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
    }
  case 'betanet':
    return {
      networkId: 'betanet',
      nodeUrl: 'https://rpc.betanet.near.org',
      nftContract: nft_contract,
      marketplaceContract: marketplace_contract,
      walletUrl: 'https://wallet.betanet.near.org',
      helperUrl: 'https://helper.betanet.near.org',
      explorerUrl: 'https://explorer.betanet.near.org',
    }
  case 'local':
    return {
      networkId: 'local',
      nodeUrl: 'http://localhost:3030',
      keyPath: `${process.env.HOME}/.near/validator_key.json`,
      walletUrl: 'http://localhost:4000/wallet',
      nftContract: nft_contract,
      marketplaceContract: marketplace_contract,
    }
  case 'test':
  case 'ci':
    return {
      networkId: 'shared-test',
      nodeUrl: 'https://rpc.ci-testnet.near.org',
      nftContract: nft_contract,
      marketplaceContract: marketplace_contract,
      masterAccount: 'test.near',
    }
  case 'ci-betanet':
    return {
      networkId: 'shared-test-staging',
      nodeUrl: 'https://rpc.ci-betanet.near.org',
      nftContract: nft_contract,
      marketplaceContract: marketplace_contract,
      masterAccount: 'test.near',
    }
  default:
    throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}

module.exports = getConfig
