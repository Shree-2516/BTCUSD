import fs from 'fs';
import path from 'path';

const files = [
  'e:\\PROJECTS\\BTCUSD\\frontend\\src\\products\\wallet\\pages\\WalletHome.jsx',
  'e:\\PROJECTS\\BTCUSD\\frontend\\src\\products\\news\\pages\\NewsHome.jsx',
  'e:\\PROJECTS\\BTCUSD\\frontend\\src\\products\\reports\\pages\\ReportsHome.jsx',
  'e:\\PROJECTS\\BTCUSD\\frontend\\src\\products\\predictions\\pages\\PredictionsHome.jsx',
  'e:\\PROJECTS\\BTCUSD\\frontend\\src\\products\\insights\\pages\\InsightsHome.jsx',
  'e:\\PROJECTS\\BTCUSD\\frontend\\src\\products\\analytics\\pages\\AnalyticsHome.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import
  content = content.replace(
    "import { productModules } from '../../../config/productModules';",
    "import { productRegistry } from '../../../core/plugins/ProductRegistry';"
  );
  
  // Replace usage
  // Example: const modules = productModules.analytics;
  content = content.replace(
    /const modules = productModules\.([a-zA-Z0-9_]+);/,
    "const modules = productRegistry.getModules('$1');"
  );
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
