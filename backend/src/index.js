const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

server.express.use(cookieParser());
// TODO Use express middlware to populate current user

//Decode the JWT so we can get the user id on each request
server.express.use((req, res, next) => {
	const { token } = req.cookies;
	if (token) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET);
		// Grabbing token from "req.cookies" using JWT method to decode token to grab userId for each request
		req.userId = userId;
	}
	next();
});

// 2. Create middleware that populates the user on each request
server.express.use(async (req, res, next) => {
	// if they aren't logged in, skip this
	if (!req.userId) return next();

	const user = await db.query.user({ where: { id: req.userId } }, `{ id, permissions, email, name }`);
	console.log(user);
	req.user = user;
	next();
});

server.start(
	{
		cors: {
			credentials: true,
			origin: process.env.FRONTEND_URL
		}
	},
	(res) => {
		console.log(`Warpage locked on http://localhost:${res.port}`);
	}
);
