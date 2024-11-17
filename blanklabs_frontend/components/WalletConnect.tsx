import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

interface WalletConnectProps {
  setProvider: (provider: any) => void; // Adjust this type as needed
}

export default function WalletConnect({ setProvider }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed!');
      return;
    }

    await connect();

    if (chain?.id !== 80002) {
      if (switchNetwork) {
        switchNetwork(80002); // Automatically switch to the correct network
      }
      return;
    }

    // Set provider for external usage
    const provider = window.ethereum;
    setProvider(provider);
  };

  return (
    <>
      {isConnected && address ? (
        <span className="text-blue-400 font-semibold">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      )}
    </>
  );
}