const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');

const Mutations = {
	async createItem(parent, args, ctx, info) {
		// TODO: Check if they are logged in
		if (!ctx.request.userId) {
			throw new Error('You must be logged in to do that');
		}
		const item = await ctx.db.mutation.createItem(
			{
				data: {
					...args
				}
			},
			info
		);

		console.log(item);

		return item;
	},
	updateItem(parent, args, ctx, info) {
		// Create copy of updates
		const updates = { ...args };
		// remove the ID from the updates
		delete updates.id;
		// run update method
		return ctx.db.mutation.updateItem(
			{
				// `updateItem` From Pisma/GraphQL API
				data: updates,
				where: {
					id: args.id //New Item id coming from args, replacing what we deleted from in updates.id
				}
			},
			info
		); //Info is what we will be sending on the client side, info is also referring to Item! in the schema.graphql
	},
	async deleteItem(parent, args, ctx, info) {
		const where = { id: args.id };
		// 1. Find the item
		const item = await ctx.db.query.item({ where }, `{id title}`);
		// 2. Check if they own the item
		// TODO
		// 3. Delete
		return ctx.db.mutation.deleteItem({ where }, info);
	},
	// Has to be same name as the mutation in our schema
	async signup(parent, args, ctx, info) {
		args.email = args.email.toLowerCase();
		// Hash Password
		const password = await bcrypt.hash(args.password, 10);
		// createUser is from the prisma.graphql file that was generated for us
		const user = await ctx.db.mutation.createUser(
			{
				data: {
					...args,
					password,
					permissions: { set: [ 'USER' ] }
				}
			},
			info
		);
		// Create the JWT token for them
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// We set the jwt as a cookie on the response
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie
		});
		// Return user to browser
		return user;
	},
	async signin(parent, { email, password }, ctx, info) {
		// 1. Check if there is a user
		const user = await ctx.db.query.user({ where: { email } });
		// 1a. If there is no user
		if (!user) {
			throw new Error(`No such user found for email ${email}`);
		}
		// 2. Check if their password is correct
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			throw new Error('Invalid Password!');
		}
		// 3. Generate the JWT Token
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// 4. Set the cookie with the token
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie
		});
		// 5. Return the user
		return user;
	},
	signout(parent, args, ctx, info) {
		ctx.response.clearCookie('token');
		return { message: 'Goodbye Homie' };
	},
	async requestReset(parent, args, ctx, info) {
		// 1. Check if this is a real user
		const user = await ctx.db.query.user({ where: { email: args.email } });
		if (!user) {
			throw new Error(`No such user found for email ${args.email}`);
		}
		// 2. Set a reset token and expiry on that user

		// Module are best ran asynchronously and the "randomBytes" module returns a callback, but "promisify" will convert it into a "promise" based function
		// Argument of "20" sets how long you wish it to be and convert it to a hex
		const randomByesPromisified = promisify(randomBytes);
		const resetToken = (await randomByesPromisified(20)).toString('hex');
		// 1 hour expiration
		const resetTokenExpiry = Date.now() + 3600000;
		const res = ctx.db.mutation.updateUser({
			where: { email: args.email },
			data: { resetToken, resetTokenExpiry }
		});

		const mailRes = await transport.sendMail({
			from: 'vince@gmail.com',
			to: user.email,
			subject: 'Password Reset Token',
			html: makeANiceEmail(
				`Your password reset token is here 
				\n \n 
				<a href=${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}>Click here to reset</a>`
			)
		});

		return { message: 'Password Reset' };
		// 3. Email them that reset token
	},

	async resetPassword(parent, args, ctx, info) {
		// 1. Check if passwords match
		if (args.password !== args.confirmPassword) throw new Error("Passwords don't match!");
		// 2. Check if its a legit reset token
		// 3. Check it its expired
		const [ user ] = await ctx.db.query.users({
			where: {
				resetToken: args.resetToken,
				resetTokenExpiry_gte: Date.now() - 3600000
			}
		});
		if (!user) throw new Error('This token is either invalid or exired');
		// 4. Hash their new password
		const password = await bcrypt.hash(args.password, 10);
		// 5. Save the new password ot the user and remove all resetToken fields
		const updateUser = ctx.db.mutation.updateUser({
			where: { email: user.email },
			data: {
				password,
				resetToken: null,
				resetTokenExpiry: null
			}
		});
		// 6. Generate JWT
		const token = jwt.sign({ userId: updateUser.id }, process.env.APP_SECRET);
		// 7. Set the JWT cookie
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie
		});
		// 8. Return new User
		return updateUser;
	}
};

module.exports = Mutations;
