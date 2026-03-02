const Customer = require('../models/customerModel');

(async () => {
    const all = await Customer.getAllWithAnalytics({ search: '' });
    const tar = await Customer.getAllWithAnalytics({ search: 'tar' });
    const s79 = await Customer.getAllWithAnalytics({ search: '79' });

    console.log({ all: all.length, tar: tar.length, s79: s79.length });
    console.log('tar names:', tar.map((r) => r.name));
    console.log('79 phones:', s79.map((r) => r.phone));

    process.exit(0);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
