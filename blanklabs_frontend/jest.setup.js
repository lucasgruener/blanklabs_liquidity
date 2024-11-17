import '@testing-library/jest-dom'

jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x123',
    isConnected: true,
  }),
  usePublicClient: () => ({})
}))

jest.mock('viem', () => ({
  decodeEventLog: jest.fn(),
  formatUnits: jest.fn(),
  getAddress: jest.fn(),
}))