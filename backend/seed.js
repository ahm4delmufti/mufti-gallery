const db = require('./db');
const fs = require('fs');
const path = require('path');

const productsDataPath = path.resolve(__dirname, '../data/products.json');

try {
  const products = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));

  db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO products (
      title, title_ar, title_it, title_fr, title_es, title_zh,
      description, description_ar, description_it, description_fr, description_es, description_zh,
      price, category, image, stock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    products.forEach(product => {
      stmt.run(
        product.title,
        product.title_ar || '',
        product.title_it || '',
        product.title_fr || '',
        product.title_es || '',
        product.title_zh || '',
        product.description || '',
        product.description_ar || '',
        product.description_it || '',
        product.description_fr || '',
        product.description_es || '',
        product.description_zh || '',
        product.price || 0,
        product.category || 'General',
        product.image || '',
        10 // default stock
      );
    });

    stmt.finalize();
    console.log('Database seeded with initial products!');
  });
} catch (err) {
  console.error('Error seeding database:', err.message);
}
