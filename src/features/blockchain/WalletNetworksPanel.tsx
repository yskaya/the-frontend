import { useBlockchainContext } from './BlockchainProvider';

export function WalletNetworkPanel() {
  const { wallet } = useBlockchainContext();
  const networkName = wallet.data?.network ?? "Sepolia";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <div className={`h-2 w-2 rounded-full bg-green-500`} />
      <p className="text-xs font-medium text-white">
        {networkName}
      </p>
    </div>
  );
}

