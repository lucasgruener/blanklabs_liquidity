import { render, screen } from '@testing-library/react'
import Home from '../pages/index'
import '@testing-library/jest-dom'

jest.mock('../components/WalletConnect', () => {
  return function DummyWalletConnect() {
    return <div data-testid="wallet-connect">Wallet Connect</div>
  }
})

jest.mock('../components/DepositWithdraw', () => {
  return function DummyDepositWithdraw() {
    return <div data-testid="deposit-withdraw">Deposit/Withdraw</div>
  }
})

jest.mock('../components/TransactionTable', () => {
  return function DummyTransactionTable() {
    return <div data-testid="transaction-table">Transaction Table</div>
  }
})

describe('Home', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByTestId('wallet-connect')).toBeInTheDocument()
  })
})