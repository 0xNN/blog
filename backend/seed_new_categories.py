"""Additional bilingual seed articles for the 3 new categories.
Additive: only inserts articles for categories that don't yet have content.
"""
import uuid
from datetime import datetime, timezone, timedelta


def _now_iso(offset_hours: int = 0) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=offset_hours)).isoformat()


def _article(author, category, cover, tags, featured, id_data, en_data, hours_ago):
    now = _now_iso(hours_ago)
    return {
        "id": str(uuid.uuid4()),
        "author_id": author["id"],
        "author_name": author["name"],
        "author_slug": author["slug"],
        "author_avatar": author.get("avatar_url", ""),
        "category_slug": category,
        "tags": tags,
        "cover_image": cover,
        "ads_enabled": True,
        "featured": featured,
        "status": "published",
        "views": 50 + hash(id_data["slug"]) % 3000,
        "created_at": now,
        "updated_at": now,
        "published_at": now,
        "reading_time": max(3, len(id_data["body_md"]) // 1000),
        "content_id": id_data,
        "content_en": en_data,
    }


def build_new_category_articles(owner, author):
    """Return 4 bilingual articles across ai-agents, blockchain-crypto, trading."""
    return [
        # ---- AI AGENTS ----
        _article(
            owner, "ai-agents",
            "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?crop=entropy&cs=srgb&fm=jpg&w=1200",
            ["ai", "agents", "langchain", "autogpt"], True,
            {
                "title": "Bangun AI Agent Pertamamu dengan LangChain & Claude Sonnet 4.5",
                "slug": "bangun-ai-agent-langchain-claude-2026",
                "excerpt": "Panduan hands-on membangun autonomous agent yang bisa search web, panggil API, dan reason multi-step.",
                "meta_description": "Tutorial lengkap membangun AI Agent dengan LangChain + Claude Sonnet 4.5: tool calling, memory, dan multi-step reasoning.",
                "body_md": """## Apa itu AI Agent?

AI Agent adalah LLM yang bisa mengambil aksi — memanggil tools, browsing web, memanipulasi file — bukan sekadar chat. Bedanya dengan chatbot biasa: agent punya loop *plan → act → observe → refine*.

## Setup

```bash
pip install langchain langchain-anthropic langchain-community duckduckgo-search
```

## Kode Minimal

```python
from langchain_anthropic import ChatAnthropic
from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import DuckDuckGoSearchRun

llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0)
tools = [DuckDuckGoSearchRun()]

agent = create_react_agent(llm, tools, prompt_template)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({"input": "Apa harga BTC hari ini dan trend 7 hari?"})
print(result["output"])
```

## 3 Pola Agent yang Umum

1. **ReAct** — Reason + Act loop, cocok untuk tugas eksploratif
2. **Plan-and-Execute** — Rencanakan dulu semua step, eksekusi berurutan
3. **Multi-Agent** — Beberapa agent kolaborasi (researcher + writer + reviewer)

## Tips Produksi

- Selalu batasi `max_iterations` (default agent bisa loop selamanya)
- Log setiap step untuk debugging
- Gunakan Redis buat conversation memory antar-session
- Cost monitoring — agent bisa habis token cepat kalau tool descriptions kurang jelas
""",
            },
            {
                "title": "Build Your First AI Agent with LangChain & Claude Sonnet 4.5",
                "slug": "build-first-ai-agent-langchain-claude-2026",
                "excerpt": "Hands-on guide to building an autonomous agent that browses the web, calls APIs, and reasons multi-step.",
                "meta_description": "Complete tutorial to build an AI Agent with LangChain + Claude Sonnet 4.5: tool calling, memory, multi-step reasoning.",
                "body_md": """## What is an AI Agent?

An AI Agent is an LLM that can *take actions* — invoke tools, browse the web, manipulate files — not just chat. The key difference from a plain chatbot: agents run a *plan → act → observe → refine* loop.

## Setup

```bash
pip install langchain langchain-anthropic langchain-community duckduckgo-search
```

## Minimal Code

```python
from langchain_anthropic import ChatAnthropic
from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import DuckDuckGoSearchRun

llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0)
tools = [DuckDuckGoSearchRun()]

agent = create_react_agent(llm, tools, prompt_template)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({"input": "What's BTC price today and the 7-day trend?"})
print(result["output"])
```

## 3 Common Agent Patterns

1. **ReAct** — Reason + Act loop, best for exploratory tasks
2. **Plan-and-Execute** — Plan all steps first, then execute sequentially
3. **Multi-Agent** — Multiple agents collaborate (researcher + writer + reviewer)

## Production Tips

- Always set `max_iterations` (default agents can loop forever)
- Log every step for debugging
- Use Redis for cross-session conversation memory
- Cost monitoring — agents burn tokens fast if tool descriptions aren't crisp
""",
            }, 3,
        ),
        # ---- BLOCKCHAIN & CRYPTO ----
        _article(
            owner, "blockchain-crypto",
            "https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?crop=entropy&cs=srgb&fm=jpg&w=1200",
            ["ethereum", "solidity", "smart-contract", "web3"], True,
            {
                "title": "Deploy Smart Contract ERC-20 dari Nol dengan Hardhat",
                "slug": "deploy-smart-contract-erc20-hardhat-2026",
                "excerpt": "Tulis, test, deploy token ERC-20 kamu sendiri ke Sepolia testnet. Lengkap dengan verify di Etherscan.",
                "meta_description": "Tutorial deploy smart contract ERC-20 dengan Hardhat 2026: setup, test, deploy ke Sepolia, verify Etherscan.",
                "body_md": """## Kenapa ERC-20?

ERC-20 adalah standar token paling banyak dipakai di Ethereum — USDC, DAI, LINK semua ERC-20. Sekali paham, kamu bisa deploy token kamu sendiri untuk project apapun.

## Setup Project

```bash
mkdir my-token && cd my-token
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npx hardhat init
```

## Kontrak Sederhana

```solidity
// contracts/DevHubToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DevHubToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("DevHub Token", "DHUB")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

## Test Cepat

```javascript
// test/DevHubToken.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DevHubToken", () => {
  it("deploys with correct supply", async () => {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("DevHubToken");
    const token = await Token.deploy(1000000n * 10n ** 18n);
    expect(await token.balanceOf(owner.address)).to.equal(1000000n * 10n ** 18n);
  });
});
```

## Deploy ke Sepolia

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("DevHubToken");
  const token = await Token.deploy(hre.ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("Deployed to:", await token.getAddress());
}
main().catch(console.error);
```

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Verify di Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> 1000000000000000000000000
```

## Peringatan Keamanan

1. Jangan pakai `tx.origin` untuk auth — pakai `msg.sender`
2. Selalu gunakan `SafeERC20` kalau interaksi dengan token lain
3. Audit dulu sebelum mainnet — bug reentrancy bisa habisi kontrak
4. Gunakan multisig (Gnosis Safe) untuk owner privileges
""",
            },
            {
                "title": "Deploy Your First ERC-20 Smart Contract with Hardhat",
                "slug": "deploy-erc20-smart-contract-hardhat-2026",
                "excerpt": "Write, test, and deploy your own ERC-20 token to Sepolia testnet — including Etherscan verification.",
                "meta_description": "2026 tutorial: deploy an ERC-20 smart contract with Hardhat — setup, test, deploy to Sepolia, verify on Etherscan.",
                "body_md": """## Why ERC-20?

ERC-20 is the most widely used token standard on Ethereum — USDC, DAI, LINK are all ERC-20. Once you understand it, you can deploy your own token for any project.

## Project Setup

```bash
mkdir my-token && cd my-token
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npx hardhat init
```

## Minimal Contract

```solidity
// contracts/DevHubToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DevHubToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("DevHub Token", "DHUB")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

## Quick Test

```javascript
// test/DevHubToken.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DevHubToken", () => {
  it("deploys with correct supply", async () => {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("DevHubToken");
    const token = await Token.deploy(1000000n * 10n ** 18n);
    expect(await token.balanceOf(owner.address)).to.equal(1000000n * 10n ** 18n);
  });
});
```

## Deploy to Sepolia

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("DevHubToken");
  const token = await Token.deploy(hre.ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("Deployed to:", await token.getAddress());
}
main().catch(console.error);
```

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Verify on Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> 1000000000000000000000000
```

## Security Warnings

1. Never use `tx.origin` for auth — always `msg.sender`
2. Always use `SafeERC20` when interacting with other tokens
3. Audit before mainnet — one reentrancy bug can drain the contract
4. Use a multisig (Gnosis Safe) for owner privileges
""",
            }, 5,
        ),
        # ---- TRADING ----
        _article(
            author, "trading",
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?crop=entropy&cs=srgb&fm=jpg&w=1200",
            ["trading", "python", "backtesting", "algo-trading"], True,
            {
                "title": "Backtesting Strategi Trading Crypto dengan Python & Backtrader",
                "slug": "backtesting-strategi-trading-crypto-python-2026",
                "excerpt": "Uji strategi SMA crossover di data historis BTC/USD sebelum risk uang beneran. Setup lengkap.",
                "meta_description": "Backtesting strategi trading crypto pakai Backtrader Python di data BTC/USD — SMA crossover, metrics, dan risk management.",
                "body_md": """## Jangan Trading Tanpa Backtest

Aturan #1 trading algorithm: **kalau strategimu tidak profitable di data historis 3 tahun, dia tidak akan profitable di masa depan**. Berikut cara benar backtest pakai Python.

## Setup

```bash
pip install backtrader pandas ccxt matplotlib
```

## Ambil Data BTC/USD

```python
import ccxt
import pandas as pd
from datetime import datetime

exchange = ccxt.binance()
ohlcv = exchange.fetch_ohlcv("BTC/USDT", timeframe="1d", limit=1000)
df = pd.DataFrame(ohlcv, columns=["ts", "open", "high", "low", "close", "volume"])
df["datetime"] = pd.to_datetime(df["ts"], unit="ms")
df.set_index("datetime", inplace=True)
df.drop(columns=["ts"], inplace=True)
df.to_csv("btc_daily.csv")
```

## Strategi SMA Crossover

Buy ketika SMA(20) memotong SMA(50) dari bawah. Sell ketika sebaliknya.

```python
import backtrader as bt

class SmaCross(bt.Strategy):
    params = dict(fast=20, slow=50)

    def __init__(self):
        self.sma_fast = bt.ind.SMA(period=self.p.fast)
        self.sma_slow = bt.ind.SMA(period=self.p.slow)
        self.crossover = bt.ind.CrossOver(self.sma_fast, self.sma_slow)

    def next(self):
        if not self.position and self.crossover > 0:
            self.buy(size=self.broker.getcash() * 0.95 / self.data.close[0])
        elif self.position and self.crossover < 0:
            self.close()

cerebro = bt.Cerebro()
cerebro.addstrategy(SmaCross)
data = bt.feeds.GenericCSVData(
    dataname="btc_daily.csv",
    dtformat="%Y-%m-%d %H:%M:%S",
    timeframe=bt.TimeFrame.Days,
    compression=1,
    openinterest=-1,
)
cerebro.adddata(data)
cerebro.broker.setcash(10000.0)
cerebro.broker.setcommission(commission=0.001)
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
cerebro.addanalyzer(bt.analyzers.DrawDown, _name="dd")

print(f"Starting: {cerebro.broker.getvalue():.2f}")
results = cerebro.run()
print(f"Ending:   {cerebro.broker.getvalue():.2f}")
print(f"Sharpe:   {results[0].analyzers.sharpe.get_analysis()['sharperatio']:.2f}")
print(f"Max DD:   {results[0].analyzers.dd.get_analysis()['max']['drawdown']:.2f}%")

cerebro.plot()
```

## Metrics yang Wajib Dilihat

| Metric | Target Minimum |
|--------|----------------|
| Sharpe Ratio | > 1.0 (>1.5 bagus) |
| Max Drawdown | < 25% |
| Win Rate | > 45% dengan RR yang bagus |
| Profit Factor | > 1.5 |

## Peringatan Penting

- **Overfitting**: kalau param-tune terus di data yang sama, hasilnya bias
- **Look-ahead bias**: pastikan indikator tidak pakai future data
- **Slippage & fees**: BTC spread di exchange retail bisa 0.1-0.3%
- **Paper trade dulu** minimal 1-2 bulan sebelum live capital

Trading bukan judi — tapi tanpa backtest yang bener, tetap saja jadi judi.
""",
            },
            {
                "title": "Backtest a Crypto Trading Strategy with Python & Backtrader",
                "slug": "backtest-crypto-trading-strategy-python-2026",
                "excerpt": "Test an SMA crossover on 3 years of BTC/USD data before risking real money. Complete setup.",
                "meta_description": "Backtest a crypto trading strategy with Backtrader Python on BTC/USD — SMA crossover, key metrics, risk management.",
                "body_md": """## Never Trade Without Backtesting

Rule #1 of algo trading: **if your strategy isn't profitable on 3 years of historical data, it won't be profitable in the future either**. Here's how to backtest properly in Python.

## Setup

```bash
pip install backtrader pandas ccxt matplotlib
```

## Fetch BTC/USD Data

```python
import ccxt
import pandas as pd
from datetime import datetime

exchange = ccxt.binance()
ohlcv = exchange.fetch_ohlcv("BTC/USDT", timeframe="1d", limit=1000)
df = pd.DataFrame(ohlcv, columns=["ts", "open", "high", "low", "close", "volume"])
df["datetime"] = pd.to_datetime(df["ts"], unit="ms")
df.set_index("datetime", inplace=True)
df.drop(columns=["ts"], inplace=True)
df.to_csv("btc_daily.csv")
```

## SMA Crossover Strategy

Buy when SMA(20) crosses SMA(50) from below. Sell on the reverse crossover.

```python
import backtrader as bt

class SmaCross(bt.Strategy):
    params = dict(fast=20, slow=50)

    def __init__(self):
        self.sma_fast = bt.ind.SMA(period=self.p.fast)
        self.sma_slow = bt.ind.SMA(period=self.p.slow)
        self.crossover = bt.ind.CrossOver(self.sma_fast, self.sma_slow)

    def next(self):
        if not self.position and self.crossover > 0:
            self.buy(size=self.broker.getcash() * 0.95 / self.data.close[0])
        elif self.position and self.crossover < 0:
            self.close()

cerebro = bt.Cerebro()
cerebro.addstrategy(SmaCross)
data = bt.feeds.GenericCSVData(
    dataname="btc_daily.csv",
    dtformat="%Y-%m-%d %H:%M:%S",
    timeframe=bt.TimeFrame.Days,
    compression=1,
    openinterest=-1,
)
cerebro.adddata(data)
cerebro.broker.setcash(10000.0)
cerebro.broker.setcommission(commission=0.001)
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
cerebro.addanalyzer(bt.analyzers.DrawDown, _name="dd")

print(f"Starting: {cerebro.broker.getvalue():.2f}")
results = cerebro.run()
print(f"Ending:   {cerebro.broker.getvalue():.2f}")
print(f"Sharpe:   {results[0].analyzers.sharpe.get_analysis()['sharperatio']:.2f}")
print(f"Max DD:   {results[0].analyzers.dd.get_analysis()['max']['drawdown']:.2f}%")

cerebro.plot()
```

## Metrics You Must Track

| Metric | Minimum Target |
|--------|----------------|
| Sharpe Ratio | > 1.0 (>1.5 is good) |
| Max Drawdown | < 25% |
| Win Rate | > 45% with a decent R:R |
| Profit Factor | > 1.5 |

## Critical Warnings

- **Overfitting**: constant param tuning on the same data creates biased results
- **Look-ahead bias**: make sure your indicators don't use future data
- **Slippage & fees**: BTC spread on retail exchanges can be 0.1–0.3%
- **Paper trade first** for at least 1–2 months before deploying real capital

Trading isn't gambling — but without proper backtesting, it might as well be.
""",
            }, 8,
        ),
        # ---- BLOCKCHAIN & CRYPTO #2 (an author-written piece) ----
        _article(
            author, "blockchain-crypto",
            "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?crop=entropy&cs=srgb&fm=jpg&w=1200",
            ["defi", "uniswap", "yield-farming"], False,
            {
                "title": "DeFi 101: Yield Farming Aman untuk Pemula (Non-Judi)",
                "slug": "defi-101-yield-farming-aman-pemula",
                "excerpt": "Panduan realistis yield farming — kenali risiko impermanent loss, rug pull, dan smart contract exploit.",
                "meta_description": "DeFi yield farming untuk pemula 2026: cara menilai protokol, memahami impermanent loss, dan menghindari rug pull.",
                "body_md": """## Yield Farming Bukan Uang Gratis

APY 200% terdengar menggiurkan? Kemungkinan besar itu ponzi. Yield farming yang legit di 2026 biasanya di kisaran 3–15% APY untuk stablecoin, dan lebih tinggi untuk pair volatile — dengan risiko lebih tinggi.

## 3 Cara Kerja Utama

1. **Lending** (Aave, Compound) — pinjamkan aset, dapat bunga
2. **Liquidity Providing** (Uniswap, Curve) — kasih pair ke pool, dapat fee swap
3. **Staking** (Lido, Rocket Pool) — kunci token, dapat reward

## Impermanent Loss — Musuh Utama

Kalau kamu LP ETH/USDC dan ETH naik 2x, kamu akan punya *lebih sedikit* ETH dibanding hold saja. Ini disebut impermanent loss. Kalau harga kembali ke awal, loss hilang — tapi kalau tidak, loss jadi permanent.

## Checklist Sebelum Deposit

- [ ] Protokol sudah diaudit oleh minimal 2 firma (Certik, Trail of Bits, OpenZeppelin)
- [ ] TVL > $50M dan bertahan minimal 6 bulan
- [ ] Tim publik dengan track record
- [ ] Kontrak sudah open-source dan verified di block explorer
- [ ] Ada bug bounty aktif

## Jangan Ini

- ❌ APY 3-digit tanpa sumber yield yang jelas
- ❌ Token native dengan supply infinite/tanpa cap
- ❌ Tim anonim + Discord ban semua yang tanya kritis
- ❌ Locked funds > 30 hari tanpa unlock schedule yang jelas

## Alokasi Portfolio DeFi (Contoh Konservatif)

- 60% stablecoin lending (Aave USDC, DAI)
- 30% blue-chip staking (stETH, rETH)
- 10% eksperimen (LP di new protocols, small size)

Slow and steady wins. DeFi is a marathon, not a rug pull sprint.
""",
            },
            {
                "title": "DeFi 101: Safe Yield Farming for Beginners (Not Gambling)",
                "slug": "defi-101-safe-yield-farming-beginners",
                "excerpt": "A realistic beginner's guide — understand impermanent loss, rug pulls, and smart contract exploits.",
                "meta_description": "DeFi yield farming for beginners 2026: how to evaluate protocols, understand impermanent loss, and avoid rug pulls.",
                "body_md": """## Yield Farming Isn't Free Money

200% APY sounds sweet? It's probably a ponzi. Legit yield farming in 2026 lives in the 3–15% APY range for stablecoins, higher for volatile pairs — with proportionally higher risk.

## The 3 Main Mechanisms

1. **Lending** (Aave, Compound) — lend assets, earn interest
2. **Liquidity Providing** (Uniswap, Curve) — supply pairs to pools, earn swap fees
3. **Staking** (Lido, Rocket Pool) — lock tokens, earn rewards

## Impermanent Loss — The Silent Killer

If you LP ETH/USDC and ETH doubles, you'll have *less* ETH than if you had just held. That's impermanent loss. If the price returns to entry, it disappears — otherwise, it's permanent.

## Pre-Deposit Checklist

- [ ] Protocol audited by at least 2 firms (Certik, Trail of Bits, OpenZeppelin)
- [ ] TVL > $50M and stable for 6+ months
- [ ] Public team with a track record
- [ ] Contracts open-source and verified on the block explorer
- [ ] Active bug bounty

## Red Flags

- ❌ 3-digit APY with no clear yield source
- ❌ Native token with infinite/uncapped supply
- ❌ Anonymous team + Discord bans anyone asking hard questions
- ❌ Locked funds > 30 days with no clear unlock schedule

## Sample Conservative DeFi Allocation

- 60% stablecoin lending (Aave USDC, DAI)
- 30% blue-chip staking (stETH, rETH)
- 10% experiments (LP in newer protocols, small size)

Slow and steady wins. DeFi is a marathon, not a rug-pull sprint.
""",
            }, 20,
        ),
    ]


async def seed_new_categories(db):
    """Additive seed — inserts one bilingual article per new category if that category is empty."""
    empty_cats = []
    for slug in ("ai-agents", "blockchain-crypto", "trading"):
        if await db.articles.count_documents({"category_slug": slug}) == 0:
            empty_cats.append(slug)
    if not empty_cats:
        return 0

    users = await db.users.find({}, {"_id": 0}).to_list(10)
    if len(users) < 2:
        return 0
    owner = next((u for u in users if u["role"] == "owner"), users[0])
    author = next((u for u in users if u["role"] == "author"), users[-1])

    articles = build_new_category_articles(owner, author)
    to_insert = [a for a in articles if a["category_slug"] in empty_cats]
    if to_insert:
        await db.articles.insert_many([{**a} for a in to_insert])
    return len(to_insert)
