const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils.js');

const Query = {
	// items: forwardTo('db') // quick way with no custom logic
	items: forwardTo('db'),
	item: forwardTo('db'),
	itemsConnection: forwardTo('db'),
	me(parent, args, ctx, info) {
		// Check if there is a current user ID
		if (!ctx.request.userId) return null;
		// "user()" method comes from the Prisma auto generated model
		return ctx.db.query.user(
			{
				where: { id: ctx.request.userId }
			},
			info
		);
	},
	async users(parent, args, ctx, info) {
		// 1. Check if they are logged in
		if (!ctx.request.userId) {
			throw new Error('You must be logged in');
		}
		// 2. Check if the user has the permissions to query all the uesrs
		hasPermission(ctx.request.user, [ 'ADMIN', 'PERMISSIONUPDATE' ]);
		// 3. If they do, query all the users
		return ctx.db.query.users({}, info);
	}
	// item: forwardTo('db'),
	// async items(parent, args, ctx, info) {
	// 	console.log('Am i running');
	// 	const items = await ctx.db.query.items();
	// 	return items;
	// },
	// async item(parent, args, ctx, info) {
	// 	console.log('Am i running');
	// 	const items = await ctx.db.query.items();
	// 	return items;
	// }
};

module.exports = Query;
