import { Chain } from 'wagmi';

export const polygonAmoy: Chain = {
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: {
    name: 'Polygon',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'], 
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology'], 
    },
  },
  blockExplorers: {
    default: {
      name: 'OKLink Amoy',
      url: 'https://www.oklink.com/amoy', 
    },
  },
  testnet: true, 
};