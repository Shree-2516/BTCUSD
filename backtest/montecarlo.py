import numpy as np
import pandas as pd

class MonteCarloSimulator:
    """
    Runs Monte Carlo simulations on trade history to assess risk.
    """
    def __init__(self, trades):
        self.trades = trades
        self.pnls = [t['pnl'] for t in trades if 'pnl' in t]

    def run(self, simulations=1000, samples_per_sim=None):
        if not self.pnls:
            return {"error": "No trades to simulate"}
            
        if samples_per_sim is None:
            samples_per_sim = len(self.pnls)
            
        results = []
        for _ in range(simulations):
            sim_sample = np.random.choice(self.pnls, size=samples_per_sim, replace=True)
            results.append(np.sum(sim_sample))
            
        results = np.array(results)
        
        return {
            "mean_pnl": float(np.mean(results)),
            "median_pnl": float(np.median(results)),
            "std_dev": float(np.std(results)),
            "prob_of_loss": float(np.sum(results < 0) / simulations * 100),
            "5th_percentile_pnl": float(np.percentile(results, 5)),
            "95th_percentile_pnl": float(np.percentile(results, 95))
        }
