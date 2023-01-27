const BigNumber = require("bignumber.js");
const Web3 = require("web3");
const ftsoAbi = require('./ftsoAbi.json');
const multicallAbi = require('./multicallAbi.json');

const node = "https://flare-api.flare.network/ext/C/rpc";
const service = new Web3(node);

const allFtsos = [
  { address: "0x2d433f7df375c62c7831bf01b770ec8746c8f44f", symbol: "XRP/USD", decimals: 5 },
  { address: "0x9a9e3981b6e0f23d71caa9986d11967fb95209ca", symbol: "LTC/USD", decimals: 5 },
  { address: "0xcc56e4d0b64d350ad495bca859d8e4375458ed55", symbol: "XLM/USD", decimals: 5 },
  { address: "0x0cbd1657bfac82daf26cacabe3c18620403158eb", symbol: "DOGE/USD", decimals: 5 },
  { address: "0x83d539d9eb43eacacb40d5adde506fd63a45cbfc", symbol: "ADA/USD", decimals: 5 },
  { address: "0x8801fc5664a0334b767b6e662736f9e7b9e26403", symbol: "ALGO/USD", decimals: 5 },
  { address: "0x22701d23dd2ac004c017eca81505143ce6aa6b13", symbol: "BCH/USD", decimals: 5 },
  { address: "0xc79644093290ac7b700107a841562cb1256b5e56", symbol: "DGB/USD", decimals: 5 },
  { address: "0xf0255d0cc1282000efaed2f0d747cf236d64d352", symbol: "BTC/USD", decimals: 5 },
  { address: "0xa0d8af011d407930740a9a142c63eb880c472d6f", symbol: "ETH/USD", decimals: 5 },  
  { address: "0xe48efe08557bbccd0b834913319fe1fb7e82d28e", symbol: "FIL/USD", decimals: 5 },
  { address: "0x6d318b71b74cf249211c06b85f7eaa561fd9bb2d", symbol: "FLR/USD", decimals: 5 },
];

const multicallAddress = "0x336897CAe2791048DA77EEa2A43BFB96342b9CE1";
const multicallContract = new service.eth.Contract(multicallAbi, multicallAddress);

const priceCalls = [];
const getCurrentPriceMethodSignature = "0xeb91d37e";
allFtsos.forEach(ftso => {
  // const ftsoContract = new service.eth.Contract(ftsoAbi, ftso.address);
  // const ftsoCall = ftsoContract.methods.getCurrentPrice().encodeABI(); 
  // Results in 0xeb91d37e;
  priceCalls.push([ftso.address, getCurrentPriceMethodSignature]);
});

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.fetchPrices = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');

  } else {
    const determinedPrices = [];
    multicallContract.methods.aggregate(priceCalls).call((error, result) => {

      if (error) {
        res.status(500).send();
      }

      allFtsos.forEach((ftso, index) => {
        const hexPrice = result.returnData[index].slice(0, 66);
        const rawPrice = new BigNumber(hexPrice);
        const price = rawPrice.shiftedBy(-ftso.decimals).toFixed();
        determinedPrices.push({ price: price, symbol: ftso.symbol });
      });
      
      res.status(200).send(determinedPrices);
    });
  }
};
