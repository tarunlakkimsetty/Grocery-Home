const listOrderRoutes = require('./routes/listOrderRoutes');

console.log('ListOrderRoutes stack:');
listOrderRoutes.stack.forEach((layer, i) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
    console.log(`  [${i}] ROUTE: ${methods} ${layer.route.path}`);
  } else {
    console.log(`  [${i}] MIDDLEWARE: ${layer.name}`);
  }
});
