import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import warnings
warnings.filterwarnings('ignore')


df = pd.read_excel('vehicle_price_forecast_2_0.xlsx', header=2)

MONTH_COLS = ['NOV 2025', 'DEC 2025', 'JAN 2026', 'FEB 2026', 'MAR 2026', 'APR 2026']

for col in MONTH_COLS:
    df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce')


avg = df.groupby('Make')[MONTH_COLS].mean()

variance_pct = avg.pct_change(axis=1) * 100          # % change across months
variance_abs = avg.diff(axis=1)                       # absolute LKR change


def fmt_m(x, _):
    """Format y-axis in millions."""
    return f'{x/1e6:.1f}M'

COLORS = plt.cm.tab20.colors
MAKES  = avg.index.tolist()



var_data = variance_pct.iloc[:, 1:]   # drop first NaN column
change_months = MONTH_COLS[1:]

fig2, ax2 = plt.subplots(figsize=(14, max(10, len(MAKES) * 0.35)))
im = ax2.imshow(var_data.values, aspect='auto', cmap='RdYlGn', vmin=-5, vmax=5)

ax2.set_xticks(range(len(change_months)))
ax2.set_xticklabels(change_months, rotation=30, ha='right', fontsize=10)
ax2.set_yticks(range(len(MAKES)))
ax2.set_yticklabels(MAKES, fontsize=8)

# Annotate cells
for row in range(len(MAKES)):
    for col in range(len(change_months)):
        val = var_data.values[row, col]
        if not np.isnan(val):
            ax2.text(col, row, f'{val:+.1f}%', ha='center', va='center',
                     fontsize=6.5, color='black' if abs(val) < 3 else 'white',
                     fontweight='bold' if abs(val) >= 1 else 'normal')

cbar = plt.colorbar(im, ax=ax2, pad=0.01)
cbar.set_label('% Price Change vs Prior Month', fontsize=10)

ax2.set_title('Month-over-Month Price Variance (%) — All Makes', fontsize=14, fontweight='bold', pad=15)
plt.tight_layout()
plt.savefig('fig2_variance_heatmap.png', dpi=150, bbox_inches='tight')
plt.close()
print("✓ fig2_variance_heatmap.png saved")


total_var = var_data.abs().sum(axis=1).sort_values(ascending=False)
top10_volatile  = total_var.head(10)
top10_stable    = total_var.tail(10).sort_values()

fig4, (ax4a, ax4b) = plt.subplots(1, 2, figsize=(16, 6))

ax4a.barh(top10_volatile.index, top10_volatile.values, color='#e15759', edgecolor='white')
ax4a.set_title('Top 10 Most Price-Volatile Makes', fontsize=12, fontweight='bold')
ax4a.set_xlabel('Total Absolute % Variance (across months)', fontsize=10)
ax4a.invert_yaxis()
ax4a.grid(axis='x', linestyle='--', alpha=0.4)
ax4a.spines[['top', 'right']].set_visible(False)

ax4b.barh(top10_stable.index, top10_stable.values, color='#59a14f', edgecolor='white')
ax4b.set_title('Top 10 Most Price-Stable Makes', fontsize=12, fontweight='bold')
ax4b.set_xlabel('Total Absolute % Variance (across months)', fontsize=10)
ax4b.invert_yaxis()
ax4b.grid(axis='x', linestyle='--', alpha=0.4)
ax4b.spines[['top', 'right']].set_visible(False)

plt.suptitle('Price Stability Ranking — All Vehicles', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('fig4_stability_ranking.png', dpi=150, bbox_inches='tight')
plt.close()
print("✓ fig4_stability_ranking.png saved")

print("\nAll 4 charts generated successfully.")
print("   • fig1_price_trends.png     — price trend per make")
print("   • fig2_variance_heatmap.png — % MoM variance heatmap")
print("   • fig3_abs_variance_bars.png — absolute price change bars")
print("   • fig4_stability_ranking.png — most/least volatile makes")