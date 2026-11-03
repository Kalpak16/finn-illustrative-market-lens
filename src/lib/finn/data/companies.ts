import type { Company, Holding } from "../types";

export const PORTFOLIO_SEED: Holding[] = [
  { ticker: "RELIANCE", name: "Reliance Industries", sector: "Energy", quantity: 420 },
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Banking", quantity: 600 },
  { ticker: "ICICIBANK", name: "ICICI Bank", sector: "Banking", quantity: 700 },
  { ticker: "INFY", name: "Infosys", sector: "IT Services", quantity: 520 },
  { ticker: "TCS", name: "Tata Consultancy Services", sector: "IT Services", quantity: 210 },
  { ticker: "WIPRO", name: "Wipro", sector: "IT Services", quantity: 1200 },
  { ticker: "LT", name: "Larsen & Toubro", sector: "Capital Goods", quantity: 230 },
  { ticker: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", quantity: 480 },
  { ticker: "ITC", name: "ITC", sector: "FMCG", quantity: 1600 },
  { ticker: "TATAMOTORS", name: "Tata Motors", sector: "Automobiles", quantity: 900 },
  { ticker: "MARUTI", name: "Maruti Suzuki", sector: "Automobiles", quantity: 60 },
  { ticker: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma", quantity: 400 },
  { ticker: "TITAN", name: "Titan Company", sector: "Consumer", quantity: 180 },
  { ticker: "NTPC", name: "NTPC", sector: "Power", quantity: 2000 },
  { ticker: "ADANIENT", name: "Adani Enterprises", sector: "Conglomerate", quantity: 250 },
  { ticker: "ASIANPAINT", name: "Asian Paints", sector: "Paints", quantity: 220 },
  { ticker: "SBIN", name: "State Bank of India", sector: "Banking", quantity: 900 },
  { ticker: "ZOMATO", name: "Eternal", sector: "Internet", quantity: 2500 },
];

export const WATCHLIST_SEED: string[] = ["TRENT", "BEL", "HAL", "POLYCAB", "VARUNBEV"];

/** Searchable NSE universe for autocomplete (demo subset). */
export const UNIVERSE: Company[] = [
  ...PORTFOLIO_SEED.map(({ ticker, name, sector }) => ({ ticker, name, sector })),
  { ticker: "TRENT", name: "Trent", sector: "Retail" },
  { ticker: "BEL", name: "Bharat Electronics", sector: "Defence" },
  { ticker: "HAL", name: "Hindustan Aeronautics", sector: "Defence" },
  { ticker: "POLYCAB", name: "Polycab India", sector: "Electricals" },
  { ticker: "VARUNBEV", name: "Varun Beverages", sector: "Beverages" },
  { ticker: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG" },
  { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking" },
  { ticker: "AXISBANK", name: "Axis Bank", sector: "Banking" },
  { ticker: "BAJFINANCE", name: "Bajaj Finance", sector: "Banking" },
  { ticker: "HCLTECH", name: "HCL Technologies", sector: "IT Services" },
  { ticker: "TECHM", name: "Tech Mahindra", sector: "IT Services" },
  { ticker: "ULTRACEMCO", name: "UltraTech Cement", sector: "Capital Goods" },
  { ticker: "M&M", name: "Mahindra & Mahindra", sector: "Automobiles" },
  { ticker: "BAJAJ-AUTO", name: "Bajaj Auto", sector: "Automobiles" },
  { ticker: "POWERGRID", name: "Power Grid Corporation", sector: "Power" },
  { ticker: "DRREDDY", name: "Dr. Reddy's Laboratories", sector: "Pharma" },
  { ticker: "CIPLA", name: "Cipla", sector: "Pharma" },
  { ticker: "NESTLEIND", name: "Nestle India", sector: "FMCG" },
  { ticker: "DMART", name: "Avenue Supermarts", sector: "Retail" },
  { ticker: "DIXON", name: "Dixon Technologies", sector: "Electricals" },
];

export function findCompany(ticker: string): Company | undefined {
  const t = ticker.trim().toUpperCase();
  return UNIVERSE.find((c) => c.ticker === t);
}

/** NSE symbols: letters, digits, & and -, up to 20 chars. */
export function isValidNseSymbol(ticker: string): boolean {
  return /^[A-Z0-9&-]{1,20}$/.test(ticker.trim().toUpperCase());
}

export function companyName(ticker: string): string {
  return findCompany(ticker)?.name ?? ticker.toUpperCase();
}
